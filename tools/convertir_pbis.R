if (.Platform$OS.type == "windows" && !isTRUE(l10n_info()[["UTF-8"]])) {
  Sys.setlocale("LC_CTYPE", "English_United States.utf8")
}
# Conversor local del cuestionario PBIS Wave 1 (exportaciones de 67 columnas).
# Instalar una vez: install.packages(c("readxl", "writexl"))
# Rscript convertir_pbis.R entrada.xlsx indicadores.xlsx "Sevilla"

texto <- function(x) {
  x <- trimws(as.character(x))
  x[is.na(x) | x == ""] <- NA_character_
  x
}
respuesta <- function(x) {
  x <- texto(x)
  # No convierte un evento sin respuesta en cero ni en «No».
  texto(sub("^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9:]{8} *-> *", "", x))
}
etiqueta <- function(x) {
  x <- tolower(enc2utf8(x))
  # La exportación de referencia contiene caracteres dañados.
  x <- gsub("ó", "o", x, fixed = TRUE)
  x <- gsub("í", "i", x, fixed = TRUE)
  x
}
nota_error <- function(id, campo, detalle) {
  stop(sprintf("ID %s, %s: %s", id, campo, detalle), call. = FALSE)
}
lista <- function(x, id, campo, permitidos, tipo = "relacion", permitir_self = FALSE) {
  if (is.na(x)) return(NULL)
  if (tolower(x) %in% c("ninguno", "ninguna", "nadie", "sin nominaciones")) {
    return(data.frame(ID = character(), valor = integer()))
  }
  piezas <- trimws(strsplit(x, "|", fixed = TRUE)[[1]])
  destinos <- character(); valores <- integer()
  for (p in piezas) {
    if (tipo == "bullying") {
      destino <- p; valor <- 1L
    } else {
      m <- regmatches(p, regexec("^(.+?)\\s*\\(([^()]*)\\)$", p, perl = TRUE))[[1]]
      if (length(m) != 3) nota_error(id, campo, paste("valoración no reconocida:", p))
      destino <- trimws(m[2]); e <- etiqueta(trimws(m[3]))
      if (tipo == "mediacion") {
        valor <- if (grepl("^buena mediaci", e)) 1L else if (grepl("^mala mediaci", e)) 0L else NA_integer_
      } else {
        valor <- if (grepl("^(muy )?buena relaci", e)) 1L else if (grepl("^(muy )?mala relaci", e)) -1L else NA_integer_
      }
      if (is.na(valor)) nota_error(id, campo, paste("categoría desconocida:", m[3]))
    }
    if (!(destino %in% permitidos)) nota_error(id, campo, paste("referencia fuera del aula o inexistente:", destino))
    if (!permitir_self && destino == id) nota_error(id, campo, "la referencia a sí mismo no se admite aquí")
    destinos <- c(destinos, destino); valores <- c(valores, valor)
  }
  if (anyDuplicated(destinos)) nota_error(id, campo, "un código aparece varias veces")
  data.frame(ID = destinos, valor = valores, stringsAsFactors = FALSE)
}
curso_canonico <- function(x) {
  vapply(x, function(curso) {
    n <- regmatches(curso, regexpr("[0-9]+", curso))
    if (!length(n)) stop(paste("Curso no reconocido:", curso), call. = FALSE)
    nivel <- if (grepl("ESO", curso, ignore.case = TRUE)) "ESO" else if (grepl("bach", curso, ignore.case = TRUE)) "Bachillerato" else if (grepl("prim|EP", curso, ignore.case = TRUE)) "Primaria" else stop(paste("Etapa no reconocida:", curso), call. = FALSE)
    valido <- as.integer(n) %in% switch(nivel, ESO = 1:4, Bachillerato = 1:2, Primaria = 4:6)
    if (!valido) stop(paste("Curso fuera del ámbito actual de la app:", curso), call. = FALSE)
    paste0(n, ".º ", nivel)
  }, character(1), USE.NAMES = FALSE)
}
# Redondeo equivalente al motor JavaScript de PBIS para cifras no negativas.
puntuacion <- function(a, b) ifelse(is.na(a) | is.na(b) | b <= 0, NA_real_, floor(100 * a / b + 0.5 + 1e-9) / 10)

transformar_pbis <- function(raw, centro, autorreporte_desde_lista = FALSE) {
  if (ncol(raw) != 67L || !identical(names(raw)[1:6], c("Usuario Id", "Alumno Id", "Estudio", "Curso", "Grupo", "Sexo"))) {
    stop("Se espera la hoja Users del modelo Wave 1: 67 columnas y las seis cabeceras iniciales originales.", call. = FALSE)
  }
  # Se verifica el anclaje de las columnas de ambas exportaciones conocidas.
  if (!(names(raw)[16] %in% c("redes1", "relations")) || !(names(raw)[54] %in% c("mediador", "med"))) {
    stop("El orden de preguntas no coincide con ninguno de los dos modelos conocidos.", call. = FALSE)
  }
  raw[] <- lapply(raw, texto)
  raw <- raw[!is.na(raw[[1]]), , drop = FALSE]
  if (!nrow(raw)) stop("No hay estudiantes en Users.", call. = FALSE)
  ids <- raw[[1]]
  if (anyDuplicated(ids)) stop("Usuario Id contiene códigos duplicados.", call. = FALSE)
  if (anyNA(raw[[3]]) || anyNA(raw[[4]]) || anyNA(raw[[5]])) stop("Faltan Estudio, Curso o Grupo.", call. = FALSE)
  if (length(centro) == 1 && is.null(names(centro))) centros <- rep(centro, nrow(raw)) else centros <- unname(centro[raw[[3]]])
  centros <- texto(centros)
  if (anyNA(centros) || length(centros) != nrow(raw)) stop("Indica un centro o un vector con un centro por ID de Estudio.", call. = FALSE)
  cursos <- curso_canonico(raw[[4]])
  claves <- paste(centros, cursos, raw[[5]], sep = "\r")
  if (any(vapply(split(raw[[3]], claves), function(x) length(unique(x)) > 1L, logical(1)))) stop("Hay distintas oleadas/estudios para la misma aula. Convierte cada oleada por separado.", call. = FALSE)
  score_cols <- c("popularidad", "sociabilidad", "reciprocidad_amistad", "acierto_amistad", "rechazo_recibido", "rechazo_declarado", "reciprocidad_rechazo", "acierto_rechazo", "bienestar", "centralidad", "mediacion")
  count_cols <- c("amistad_recibida_n", "amistad_declarada_n", "amistad_reciproca_n", "rechazo_recibido_n", "rechazo_declarado_n", "rechazo_reciproco_n", "bienestar_suma", "mediacion_n", "bullying_companeros_n", "pred_amistad_n", "pred_amistad_aciertos", "pred_rechazo_n", "pred_rechazo_aciertos")
  d <- data.frame(ID = ids, Campus = centros, Curso = cursos, Grupo = raw[[5]], Tratamiento = "alumno", stringsAsFactors = FALSE)
  for (c in c(score_cols, count_cols, "centralidad_eigenvector", "felicidad_centro", "felicidad_diversion", "felicidad_soledad")) d[[c]] <- NA_real_
  for (c in c("bullying_autorreporte", "respondio", "soledad_frecuente", "identifica_apoyo", "comunidad_amistad")) d[[c]] <- NA_character_
  d$escala_indicadores <- "normalizada_v1"; d$n_clase <- NA_integer_
  grupos <- list(); avisos <- character()
  for (ix in split(seq_len(nrow(raw)), claves)) {
    aula <- ids[ix]; n <- length(ix); d$n_clase[ix] <- n
    f <- r <- med <- bull <- matrix(0L, n, n, dimnames = list(aula, aula))
    known <- matrix(FALSE, n, 4, dimnames = list(aula, c("relacion", "prediccion", "mediacion", "bullying")))
    pred <- vector("list", n)
    for (j in seq_along(ix)) {
      i <- ix[j]; ruta <- respuesta(raw[[12]][i])
      final <- !is.na(raw[[67]][i]); inicio <- !is.na(raw[[9]][i])
      d$respondio[i] <- if (final) "Sí" else if (!inicio) "No" else NA_character_
      if (is.na(ruta)) {
        if (inicio) stop(paste("Falta la ruta Par/Impar de", ids[i]), call. = FALSE)
        next
      }
      if (!(ruta %in% c("Par", "Impar"))) nota_error(ids[i], "dia/par", "ruta distinta de Par o Impar")
      rel <- lista(respuesta(raw[[if (ruta == "Par") 16 else 66]][i]), ids[i], "relaciones", aula)
      pre <- lista(respuesta(raw[[if (ruta == "Par") 25 else 57]][i]), ids[i], "predicciones", aula)
      me <- lista(respuesta(raw[[54]][i]), ids[i], "mediación", aula, "mediacion")
      bu <- lista(respuesta(raw[[48]][i]), ids[i], "acoso", aula, "bullying", TRUE)
      known[j, ] <- !vapply(list(rel, pre, me, bu), is.null, logical(1))
      if (!is.null(rel)) {
        f[j, match(rel$ID[rel$valor > 0], aula)] <- 1L
        r[j, match(rel$ID[rel$valor < 0], aula)] <- 1L
      }
      pred[j] <- list(pre)
      if (!is.null(me)) {
        med[j, match(me$ID[me$valor > 0], aula)] <- 1L
        # Definición acordada: marcar cualquier persona en mediación = Sí,
        # independientemente de la valoración positiva o negativa.
        d$identifica_apoyo[i] <- if (nrow(me) > 0) "Sí" else "No"
      }
      if (!is.null(bu)) {
        bull[j, match(bu$ID[bu$ID != ids[i]], aula)] <- 1L
        if (autorreporte_desde_lista) d$bullying_autorreporte[i] <- if (ids[i] %in% bu$ID) "Sí" else "No"
      }
      sola <- respuesta(raw[[33]][i])
      if (!is.na(sola)) {
        if (!(sola %in% c("Nunca", "Casi nunca", "Algunas veces", "Casi siempre", "Siempre"))) nota_error(ids[i], "soledad", paste("frecuencia desconocida:", sola))
        d$soledad_frecuente[i] <- if (sola %in% c("Casi siempre", "Siempre")) "Sí" else "No"
      }
      frecuencias <- c("Nunca", "Casi nunca", "Algunas veces", "Casi siempre", "Siempre")
      for (par in list(c("felicidad_centro", "27"), c("felicidad_diversion", "30"), c("felicidad_soledad", "33"))) {
        v <- respuesta(raw[[as.integer(par[2])]][i])
        if (!is.na(v)) {
          pos <- match(v, frecuencias)
          if (is.na(pos)) nota_error(ids[i], par[1], paste("frecuencia desconocida:", v))
          d[[par[1]]][i] <- pos - 1L
        }
      }
    }
    for (type in c("amistad", "rechazo")) {
      a <- if (type == "amistad") f else r
      suf <- if (type == "amistad") c("recibida", "declarada", "reciproca") else c("recibido", "declarado", "reciproco")
      d[[paste0(type, "_", suf[2], "_n")]][ix] <- ifelse(known[, 1], rowSums(a), NA_real_)
      # Una respuesta ausente puede cambiar las entradas y reciprocidades de otras personas.
      if (all(known[, 1])) {
        d[[paste0(type, "_", suf[1], "_n")]][ix] <- colSums(a)
        d[[paste0(type, "_", suf[3], "_n")]][ix] <- rowSums(a * t(a))
      }
      for (j in seq_along(ix)) if (!is.null(pred[[j]])) {
        p <- pred[[j]]; elegidos <- p$ID[p$valor == if (type == "amistad") 1L else -1L]
        d[[paste0("pred_", type, "_n")]][ix[j]] <- length(elegidos)
        if (all(known[, 1])) d[[paste0("pred_", type, "_aciertos")]][ix[j]] <- sum(a[match(elegidos, aula), j])
      }
    }
    if (all(known[, 3])) d$mediacion_n[ix] <- colSums(med)
    if (all(known[, 4])) d$bullying_companeros_n[ix] <- colSums(bull)
    gin <- cent <- NA_real_
    if (all(known[, 1])) {
      recibidas <- colSums(f)
      gin <- if (sum(recibidas) == 0) 0 else sum(abs(outer(recibidas, recibidas, "-"))) / (2 * n * sum(recibidas))
      u <- 1L * ((f + t(f)) > 0)
      # No se asignan comunidades arbitrarias; un grafo desconectado no da una
      # centralidad única comparable para todo el aula con este método.
      vistos <- 1L
      repeat {
        nuevos <- which(colSums(u[vistos, , drop = FALSE]) > 0)
        todos <- sort(unique(c(vistos, nuevos)))
        if (identical(todos, vistos)) break
        vistos <- todos
      }
      if (n > 1 && length(vistos) == n) {
        ev <- eigen(u, symmetric = TRUE)
        v <- abs(ev$vectors[, 1]); v <- v / max(v)
        d$centralidad_eigenvector[ix] <- v
        if (n > 2) cent <- sum(1 - v) / (n - 2)
      }
    }
    g <- data.frame(Campus = centros[ix[1]], Curso = cursos[ix[1]], Grupo = raw[[5]][ix[1]], Periodo = NA_character_, salones_referencia = NA_integer_, stringsAsFactors = FALSE)
    for (c in c("pos_bullying_declarado", "pos_bullying_companeros", "pos_soledad", "pos_densidad_rechazo", "pos_sin_reciprocas", "pos_separacion", "pos_desigualdad", "pos_centralizacion", "modularidad", "gini_popularidad", "centralizacion_eigenvector")) g[[c]] <- NA_real_
    g$gini_popularidad <- gin; g$pos_desigualdad <- puntuacion(gin, 1)
    g$centralizacion_eigenvector <- cent; g$pos_centralizacion <- puntuacion(cent, 1)
    g$escala_grupo <- "normalizada_v1"
    grupos[[length(grupos) + 1]] <- g
    if (!all(known[, 1])) avisos <- c(avisos, paste(g$Campus, g$Curso, g$Grupo, ": relaciones incompletas; entradas, reciprocidades, aciertos y estructura sin calcular."))
    if (!all(known[, 3])) avisos <- c(avisos, paste(g$Campus, g$Curso, g$Grupo, ": mediación incompleta; nominaciones recibidas sin calcular."))
    if (!all(known[, 4])) avisos <- c(avisos, paste(g$Campus, g$Curso, g$Grupo, ": nominaciones de acoso incompletas; recuentos recibidos sin calcular."))
  }
  pares <- d$n_clase - 1
  for (z in list(c("popularidad", "amistad_recibida_n"), c("sociabilidad", "amistad_declarada_n"), c("rechazo_recibido", "rechazo_recibido_n"), c("rechazo_declarado", "rechazo_declarado_n"), c("mediacion", "mediacion_n"))) d[[z[1]]] <- puntuacion(d[[z[2]]], pares)
  d$reciprocidad_amistad <- puntuacion(d$amistad_reciproca_n, d$amistad_declarada_n)
  d$reciprocidad_rechazo <- puntuacion(d$rechazo_reciproco_n, d$rechazo_declarado_n)
  for (type in c("amistad", "rechazo")) d[[paste0("acierto_", type)]] <- puntuacion(d[[paste0("pred_", type, "_aciertos")]], d[[paste0("pred_", type, "_n")]])
  d$centralidad <- puntuacion(d$centralidad_eigenvector, 1)
  completas <- !is.na(d$felicidad_centro) & !is.na(d$felicidad_diversion) & !is.na(d$felicidad_soledad)
  d$bienestar_suma[completas] <- d$felicidad_centro[completas] + d$felicidad_diversion[completas] + 4 - d$felicidad_soledad[completas]
  d$bienestar <- puntuacion(d$bienestar_suma, 12)
  g <- do.call(rbind, grupos); rownames(g) <- NULL
  diccionario <- data.frame(Campo = c("ID", "Campus", "relaciones", "predicciones", "popularidad / sociabilidad / rechazo / mediacion", "reciprocidad", "acierto", "centralidad", "bienestar", "identifica_apoyo", "bullying_autorreporte", "bullying_companeros_n", "comunidades / modularidad", "valores ausentes", "escala"), Definicion = c(
    "Usuario Id original, como texto. No incluye nombres ni crea una llave ficticia.",
    "Centro indicado por la persona que realiza la conversión; no consta en el cuestionario.",
    "Buena y Muy buena relación: nominación positiva. Mala y Muy mala relación: negativa. Sin ponderación. Las elecciones no marcadas son ausencia de nominación cuando la respuesta existe.",
    "La respuesta expresa lo que cada estudiante cree que otras personas declaran sobre él/ella. Se compara con las relaciones entrantes.",
    "10 × recuento / (n_clase − 1), redondeado a un decimal.",
    "10 × elecciones correspondidas / elecciones emitidas. Denominador cero: vacío.",
    "Precisión: 10 × predicciones acertadas / predicciones emitidas. Sin predicciones: vacío.",
    "Eigenvector del grafo positivo no dirigido; máximo del aula = 1. Se calcula solo con datos completos y grafo conectado. Centralización: sum(1 − eigenvector)/(N − 2).",
    "Tres respuestas codificadas de 0 a 4: centro y diversión positivas, soledad invertida (4 − respuesta). Suma 0–12; puntuación 0–10. Descriptivo, no clínico.",
    "Sí si marca alguna persona en mediación, con cualquier valoración. No si responde explícitamente Ninguno/Nadie. Vacío si no hay respuesta.",
    if (autorreporte_desde_lista) "Inferido de la presencia del propio código en la lista de acoso; requiere aceptar expresamente esta interpretación." else "Vacío por defecto: una nominación sobre situaciones observadas no equivale a una pregunta directa de autorreporte.",
    "Nominaciones de otras personas del aula, excluyendo el propio código. Se exige cobertura completa.",
    "Sin calcular: no se decide una partición de comunidades sin acordar su método.",
    "Celdas vacías: la aplicación muestra Sin datos. Nunca se sustituyen respuestas ausentes por No o cero.",
    "normalizada_v1: proporciones descriptivas, sin baremos ni percentiles entre centros."), stringsAsFactors = FALSE)
  if (length(avisos)) diccionario <- rbind(diccionario, data.frame(Campo = "Aviso de cobertura", Definicion = avisos))
  list(Datos = d, Grupos = g, Diccionario = diccionario)
}

convertir_pbis <- function(entrada, salida, centro, hoja = "Users", autorreporte_desde_lista = TRUE, sobrescribir = FALSE) {
  for (p in c("readxl", "writexl")) if (!requireNamespace(p, quietly = TRUE)) stop(paste0("Falta ", p, ". Ejecuta install.packages(c('readxl', 'writexl'))."), call. = FALSE)
  if (!file.exists(entrada)) stop("No existe el archivo de entrada.", call. = FALSE)
  if (!grepl("\\.xlsx$", salida, ignore.case = TRUE)) stop("La salida debe terminar en .xlsx.", call. = FALSE)
  if (normalizePath(entrada, winslash = "/") == normalizePath(salida, winslash = "/", mustWork = FALSE)) stop("La salida no puede ser el archivo original.", call. = FALSE)
  if (file.exists(salida) && !sobrescribir) stop("La salida ya existe. Elige otro nombre o usa sobrescribir = TRUE.", call. = FALSE)
  raw <- as.data.frame(readxl::read_excel(entrada, sheet = hoja, col_types = "text", .name_repair = "minimal"), stringsAsFactors = FALSE)
  resultado <- transformar_pbis(raw, centro, autorreporte_desde_lista)
  writexl::write_xlsx(resultado, salida)
  message("Creado: ", salida, " (", nrow(resultado$Datos), " estudiantes; ", nrow(resultado$Grupos), " aulas). Carga la hoja Datos en PBIS; la llave de nombres es opcional.")
  invisible(resultado)
}

if (sys.nframe() == 0L) {
  args <- commandArgs(trailingOnly = TRUE)
  if (length(args) != 3L) stop('Uso: Rscript convertir_pbis.R entrada.xlsx indicadores.xlsx "Centro"', call. = FALSE)
  convertir_pbis(args[1], args[2], args[3])
}
