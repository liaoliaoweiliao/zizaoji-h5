
let selectedParts=[];

function selectPart(part){
 if(!selectedParts.includes(part)){
   selectedParts.push(part);
 }
 updateCreateButton();
}

function updateCreateButton(){
 const btn=document.querySelector('#create-btn');
 if(!btn)return;

 if(selectedParts.length>=2){
   btn.disabled=false;
   btn.classList.add('active');
 }else{
   btn.disabled=true;
   btn.classList.remove('active');
 }
}
