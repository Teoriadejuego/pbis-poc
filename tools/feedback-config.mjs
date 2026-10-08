export function feedbackConfig(value = '') {
  const endpoint = value.trim();
  if (endpoint) {
    let url;
    try { url = new URL(endpoint); } catch { throw Error('FEEDBACK_ENDPOINT debe ser una URL HTTPS completa.'); }
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
        !/^[a-z0-9.-]+$/i.test(url.hostname) || !/^\/[a-z0-9/_-]+$/i.test(url.pathname)) {
      throw Error('FEEDBACK_ENDPOINT requiere HTTPS, un dominio y una ruta sin credenciales, parámetros ni fragmentos.');
    }
    const provider = url.hostname === 'formspree.io' ? 'formspree' : 'service';
    if (provider === 'formspree' && (url.port || !/^\/f\/[a-z0-9]+$/.test(url.pathname))) {
      throw Error('Formspree requiere https://formspree.io/f/ seguido del código del formulario.');
    }
    return {endpoint:url.href, provider, recipient:'pbis_usuario@outlook.es', version:'0.10.2'};
  }
  return {endpoint:'', recipient:'pbis_usuario@outlook.es', version:'0.10.2'};
}
export const connectPolicy = config => config.endpoint || "'none'";
