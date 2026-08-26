
let selectedParts=[];

function choosePart(part){

 if(!selectedParts.includes(part)){
    selectedParts.push(part);
 }

 refreshCreateButton();

}


function refreshCreateButton(){

 const button=document.querySelector("#create-btn");

 if(!button)return;


 if(selectedParts.length < 2){

    button.disabled=true;
    button.classList.add("disabled");

 }else{

    button.disabled=false;
    button.classList.remove("disabled");

 }

}
