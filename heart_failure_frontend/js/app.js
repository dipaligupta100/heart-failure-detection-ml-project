const API_BASE_URL = "http://127.0.0.1:5000"; // Change this if your backend runs elsewhere.
const $ = (id) => document.getElementById(id);
const USERS_KEY = "cardiocare_demo_users";
const SESSION_KEY = "cardiocare_demo_session";
let authMode = "login";

function getUsers(){ try{return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");}catch{return [];} }
function setAuthMode(mode){
  authMode=mode;
  $("authTitle").textContent=mode==="login"?"Sign in to your workspace":"Create your workspace account";
  $("authSubtitle").textContent=mode==="login"?"Enter your details to continue.":"Use a name, email and demo password.";
  $("nameField").classList.toggle("hidden",mode==="login");
  $("authSubmit").innerHTML=mode==="login"?'Sign in <span>→</span>':'Create account <span>→</span>';
  $("switchText").textContent=mode==="login"?"New here?":"Already have an account?";
  $("switchAuth").textContent=mode==="login"?"Create an account":"Sign in";
  $("password").autocomplete=mode==="login"?"current-password":"new-password";
  $("authError").textContent="";
}
function enterApp(user){
  localStorage.setItem(SESSION_KEY,JSON.stringify({name:user.name,email:user.email}));
  $("userName").textContent=user.name;
  $("welcomeName").textContent=user.name.split(" ")[0];
  $("userAvatar").textContent=(user.name.trim()[0]||"U").toUpperCase();
  $("authScreen").classList.add("hidden");
  $("dashboardPage").classList.remove("hidden");
  checkApi();
}
function logout(){localStorage.removeItem(SESSION_KEY);$("authScreen").classList.remove("hidden");$("dashboardPage").classList.add("hidden");$("authForm").reset();setAuthMode("login");}
$("switchAuth").addEventListener("click",()=>setAuthMode(authMode==="login"?"signup":"login"));
$("togglePassword").addEventListener("click",()=>{const input=$("password");input.type=input.type==="password"?"text":"password";$("togglePassword").textContent=input.type==="password"?"Show":"Hide";});
$("authForm").addEventListener("submit",(e)=>{
  e.preventDefault();const name=$("fullName").value.trim();const email=$("email").value.trim().toLowerCase();const password=$("password").value;const error=$("authError");error.textContent="";
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){error.textContent="Please enter a valid email address.";return;}
  if(password.length<8){error.textContent="Password must contain at least 8 characters.";return;}
  const users=getUsers();
  if(authMode==="signup"){
    if(name.length<2){error.textContent="Please enter your name.";return;}
    if(users.some(u=>u.email===email)){error.textContent="An account with this email already exists.";return;}
    users.push({name,email,password});localStorage.setItem(USERS_KEY,JSON.stringify(users));enterApp({name,email});
  }else{
    const user=users.find(u=>u.email===email&&u.password===password);
    if(!user){error.textContent="Account not found or password is incorrect. Create a demo account first.";return;}
    enterApp(user);
  }
});
$("logoutBtn").addEventListener("click",logout);
$("startAssessment").addEventListener("click",()=>$("assessmentPanel").scrollIntoView({behavior:"smooth"}));
$("nav-assessment").addEventListener("click",()=>$("assessmentPanel").scrollIntoView({behavior:"smooth"}));
$("nav-dashboard").addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));
$("menuBtn").addEventListener("click",()=>$("sidebar").classList.toggle("open"));

async function checkApi(){
  $("apiStatus").textContent="Checking…";
  try{const r=await fetch(API_BASE_URL+"/",{method:"GET"});if(!r.ok)throw new Error("API responded "+r.status);$("apiStatus").textContent="Connected";$("apiStatusFoot").textContent="Backend is reachable";}
  catch{$("apiStatus").textContent="Offline";$("apiStatusFoot").textContent="Start your Python backend to connect";}
}
function showResult({title,text,raw="",warning=false}){
  const box=$("resultBox");box.classList.remove("hidden","warning");if(warning)box.classList.add("warning");
  $("resultTitle").textContent=title;$("resultText").textContent=text;$("resultRaw").textContent=raw;$("resultSymbol").textContent=warning?"!":"✓";
  $("latestResult").textContent=title;box.scrollIntoView({behavior:"smooth",block:"nearest"});
}
$("predictionForm").addEventListener("reset",()=>{setTimeout(()=>{$("formError").textContent="";$("resultBox").classList.add("hidden");},0);});
$("predictionForm").addEventListener("submit",async(e)=>{
  e.preventDefault();$("formError").textContent="";$("resultBox").classList.add("hidden");
  const form=e.currentTarget;
  if(!form.reportValidity()){$("formError").textContent="Please complete every field with a valid value.";return;}
  const fd=new FormData(form);
  const payload={
    age:Number(fd.get("age")), anaemia:Number(fd.get("anaemia")),
    creatinine_phosphokinase:Number(fd.get("creatinine_phosphokinase")),
    diabetes:Number(fd.get("diabetes")), ejection_fraction:Number(fd.get("ejection_fraction")),
    high_blood_pressure:Number(fd.get("high_blood_pressure")), platelets:Number(fd.get("platelets")),
    serum_creatinine:Number(fd.get("serum_creatinine")), serum_sodium:Number(fd.get("serum_sodium")),
    sex:Number(fd.get("sex")), smoking:Number(fd.get("smoking")), time:Number(fd.get("time"))
  };
  if(payload.age>120||payload.ejection_fraction>100){$("formError").textContent="Please check age and ejection fraction values.";return;}
  const btn=$("predictBtn");btn.disabled=true;btn.textContent="Sending to model…";
  try{
    const response=await fetch(API_BASE_URL+"/predict",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.detail||data.error||"Prediction API returned HTTP "+response.status);
    if(data.prediction===undefined)throw new Error("API response has no 'prediction' field. Check your backend response format.");
    const value=data.prediction;
    const isPositive=value===1||value==="1"||String(value).toLowerCase().includes("risk")||String(value).toLowerCase().includes("positive");
    showResult({
    title: "Prediction received",
    text: data.result || "Prediction: " + value,
    raw: data.probability !== undefined
        ? "Model probability: " +
          (data.probability * 100).toFixed(2) + "%"
        : "Prediction: " + value,
    warning: isPositive
});
  }catch(err){showResult({title:"Could not get prediction",text:err.message+" Make sure your backend is running and its /predict endpoint accepts these 12 feature names.",raw:"Expected API: "+API_BASE_URL+"/predict",warning:true});}
  finally{btn.disabled=false;btn.innerHTML='Run prediction <span>→</span>';}
});

(function init(){
  const session=localStorage.getItem(SESSION_KEY);
  if(session){try{enterApp(JSON.parse(session));}catch{logout();}}
  else{setAuthMode("login");}
})();
