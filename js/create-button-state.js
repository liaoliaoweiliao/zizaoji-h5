
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

 const enough = selectedParts.length >= 2;

 btn.disabled = !enough;

 if(enough){
   btn.classList.add('active');
   btn.classList.remove('disabled');
 }else{
   btn.classList.remove('active');
   btn.classList.add('disabled');
 }
}

// 防止绕过按钮逻辑进入下一页
function canCreate(){
 return selectedParts.length >= 2;
}

