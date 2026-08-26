
const XuanXuanSceneConfig={

story:{
position:"center",
image:"tantou.png"
},

workshop:{
position:"center",
image:"tuosaisikao.png"
},

charcard:{
position:"center",
image:"tiaoqilai.png"
},

collection:{
position:"center",
image:"xueshimao.png"
}

};


function showXuanScene(page){
 const config=XuanXuanSceneConfig[page];
 if(!config)return;

 const img=document.querySelector("#xuan-img");
 if(img){
   img.src="assets/xuanxuan/"+config.image;
 }
}
