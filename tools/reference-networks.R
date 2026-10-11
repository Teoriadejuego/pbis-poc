# Optional developer check: R >= 4.6, igraph 2.3.3, jsonlite.
# No production files are read. All networks below are synthetic.
# Run from the project root: Rscript tools/reference-networks.R
library(igraph)
library(jsonlite)
stopifnot(as.character(packageVersion("igraph"))=="2.3.3")
cases<-list()
add<-function(name,A,known=rep(TRUE,nrow(A))){cases[[name]]<<-list(A=A,known=known)}
A<-matrix(0,5,5);A[1,2:5]<-1;add("star",A)
A[2,1]<-1;A[3,1]<-1;A[2,3]<-1;add("reciprocity_weighted",A)
add("partial",A,c(TRUE,FALSE,TRUE,FALSE,FALSE))
add("no_answers",matrix(0,5,5),rep(FALSE,5))
add("no_edges",matrix(0,5,5))
add("singleton",matrix(0,1,1));add("two",matrix(c(0,1,0,0),2,2))
A<-matrix(0,7,7);A[1:3,1:3]<-1;A[4:6,4:6]<-1;diag(A)<-0;add("equal_components",A)
A[1,4]<-1;add("bridged_cliques_isolate",A)
for(k in seq_len(20)){
 set.seed(100+k);n<-8+k;A<-matrix(as.numeric(runif(n*n)<.15),n,n);diag(A)<-0
 add(paste0("synthetic_",k),A)
}
out<-list()
for(name in names(cases)){
 A<-cases[[name]]$A;n<-nrow(A);known<-cases[[name]]$known
 # Unknown emitters have no observed outgoing nominations.
 A[!known,]<-0
 U<-1*((A+t(A))>0);W<-A+t(A)
 eigenInfo<-list()
 for(type in c("SUM","OR")){
  mat<-if(type=="SUM") W else U
  ev<-rep(NA_real_,n);state<-if(any(known)) "no_edges" else "no_answers"
  if(any(known)&&sum(mat)>0){
   spectral<-eigen(mat,symmetric=TRUE);lambda<-max(spectral$values)
   if(sum(abs(spectral$values-lambda)<1e-10*max(1,lambda))>1)state<-"non_unique" else {
    g<-graph_from_adjacency_matrix(mat,mode="undirected",weighted=TRUE,diag=FALSE)
    set.seed(20261010);ev<-as.numeric(eigen_centrality(g,weights=E(g)$weight)$vector);state<-"ok"
   }
  }
  eigenInfo[[type]]<-list(vector=if(state=="ok") unname(ev) else NULL,status=state)
 }
 inc<-colSums(A)
 centralization<-if(!any(known)||n<3) NA_real_ else if(sum(A)==0) 0 else if(eigenInfo$SUM$status=="ok") sum(1-eigenInfo$SUM$vector)/(n-2) else NA_real_
 membership<-NULL;q<-NA_real_
 if(any(known)){
  if(sum(U)>0){g<-graph_from_adjacency_matrix(U,mode="undirected");set.seed(20261010);lou<-cluster_louvain(g,weights=NA,resolution=1);membership<-as.integer(igraph::membership(lou));membership<-match(membership,unique(membership))-1;q<-modularity(lou)} else membership<-seq_len(n)-1
 }
 gi<-if(!any(known)) NA_real_ else if(sum(inc)==0) 0 else sum(abs(outer(inc,inc,"-")))/(2*n*sum(inc))
 out[[length(out)+1]]<-list(name=name,A=unname(A),known=unname(known),eigen=eigenInfo$SUM,eigenOr=eigenInfo$OR,centralization=centralization,gini=gi,membership=membership,modularity=q,density=if(n>1&&any(known))sum(A)/(n*(n-1)) else NA_real_)
}
dir.create("tests/fixtures",showWarnings=FALSE)
write_json(list(R=as.character(getRversion()),igraph=as.character(packageVersion("igraph")),seed=20261010,cases=out),"tests/fixtures/network-reference-R.json",auto_unbox=TRUE,na="null",null="null",digits=16,pretty=TRUE)
cat("Saved",length(out),"synthetic R reference networks\n")
