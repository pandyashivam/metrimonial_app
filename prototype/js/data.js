/* =========================================================
   ShubhMilan Matrimony — Mock Data Layer
   (Browser-only prototype: localStorage where possible)
   ========================================================= */

const SAMPLE_PROFILES = [
  {
    id:"SM10001",name:"Priya Sharma",gender:"Female",dob:"1998-04-12",age:27,height:"5'4\"",
    religion:"Hindu",caste:"Brahmin",subCaste:"Gaur",gotra:"Kashyap",manglik:"No",
    motherTongue:"Hindi",rashi:"Vrishabha (Taurus)",nakshatra:"Rohini",
    city:"Jaipur",state:"Rajasthan",country:"India",
    education:"M.Tech (Computer Science)",profession:"Software Engineer",company:"Infosys",income:"₹14 LPA",
    fatherName:"Shri Rajesh Sharma",fatherOccupation:"Govt. Officer (Retd.)",
    motherName:"Smt. Sunita Sharma",motherOccupation:"Homemaker",
    siblings:"1 brother (married)",familyType:"Nuclear",familyValues:"Traditional",
    diet:"Vegetarian",drink:"No",smoke:"No",
    about:"Family-oriented, calm by nature, love reading, classical music and travelling. Looking for a kind, educated and respectful life partner.",
    partnerPref:"Age 27-32, well-educated, professionally settled, vegetarian, from Brahmin family preferred.",
    photos:["https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600",
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600",
            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600"],
    verified:true,status:"active",joined:"2026-02-15"
  },
  {
    id:"SM10002",name:"Rahul Verma",gender:"Male",dob:"1994-09-08",age:31,height:"5'10\"",
    religion:"Hindu",caste:"Kshatriya",subCaste:"Rajput",gotra:"Suryavanshi",manglik:"Yes",
    motherTongue:"Hindi",rashi:"Tula (Libra)",nakshatra:"Chitra",
    city:"Lucknow",state:"Uttar Pradesh",country:"India",
    education:"MBA (IIM Bangalore)",profession:"Product Manager",company:"Flipkart",income:"₹38 LPA",
    fatherName:"Shri Mahendra Verma",fatherOccupation:"Businessman",
    motherName:"Smt. Kavita Verma",motherOccupation:"School Principal",
    siblings:"1 sister (unmarried)",familyType:"Joint",familyValues:"Moderate",
    diet:"Non-Vegetarian",drink:"Occasionally",smoke:"No",
    about:"Easygoing, ambitious and family loving. Enjoy cricket, weekend treks and good food. Searching for an understanding partner.",
    partnerPref:"Age 25-29, graduate or higher, working/non-working both fine, family values important.",
    photos:["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600",
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600"],
    verified:true,status:"active",joined:"2026-01-20"
  },
  {
    id:"SM10003",name:"Anjali Patel",gender:"Female",dob:"2000-11-23",age:25,height:"5'3\"",
    religion:"Hindu",caste:"Patel",subCaste:"Leuva Patel",gotra:"Vatsa",manglik:"No",
    motherTongue:"Gujarati",rashi:"Mithun (Gemini)",nakshatra:"Mrigashira",
    city:"Ahmedabad",state:"Gujarat",country:"India",
    education:"CA (Chartered Accountant)",profession:"Auditor",company:"Deloitte",income:"₹11 LPA",
    fatherName:"Shri Harshad Patel",fatherOccupation:"Businessman",
    motherName:"Smt. Bharti Patel",motherOccupation:"Homemaker",
    siblings:"1 younger brother",familyType:"Nuclear",familyValues:"Traditional",
    diet:"Vegetarian",drink:"No",smoke:"No",
    about:"Cheerful, hardworking, value family and traditions. Love cooking, classical dance and gardening.",
    partnerPref:"Age 26-30, well-settled, vegetarian, Gujarati Patel community preferred.",
    photos:["https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600",
            "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600"],
    verified:true,status:"active",joined:"2026-03-04"
  },
  {
    id:"SM10004",name:"Arjun Reddy",gender:"Male",dob:"1996-06-15",age:29,height:"6'0\"",
    religion:"Hindu",caste:"Reddy",subCaste:"Kapu Reddy",gotra:"Bharadwaja",manglik:"No",
    motherTongue:"Telugu",rashi:"Mithun (Gemini)",nakshatra:"Punarvasu",
    city:"Hyderabad",state:"Telangana",country:"India",
    education:"B.Tech, MS (Stanford)",profession:"Senior Software Engineer",company:"Google",income:"₹95 LPA",
    fatherName:"Dr. Suresh Reddy",fatherOccupation:"Cardiologist",
    motherName:"Dr. Lakshmi Reddy",motherOccupation:"Pediatrician",
    siblings:"None (only child)",familyType:"Nuclear",familyValues:"Moderate",
    diet:"Non-Vegetarian",drink:"Occasionally",smoke:"No",
    about:"Tech enthusiast, fitness freak, love road trips. Believe in simplicity and honesty.",
    partnerPref:"Age 25-29, well-educated, career-oriented, open-minded.",
    photos:["https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600"],
    verified:true,status:"active",joined:"2025-12-11"
  },
  {
    id:"SM10005",name:"Kavya Iyer",gender:"Female",dob:"1997-02-28",age:28,height:"5'5\"",
    religion:"Hindu",caste:"Iyer",subCaste:"Vadama",gotra:"Srivatsa",manglik:"No",
    motherTongue:"Tamil",rashi:"Meena (Pisces)",nakshatra:"Revati",
    city:"Chennai",state:"Tamil Nadu",country:"India",
    education:"M.Sc Physics, PhD (Ongoing)",profession:"Research Scholar",company:"IIT Madras",income:"₹8 LPA",
    fatherName:"Shri Venkatraman Iyer",fatherOccupation:"Bank Manager",
    motherName:"Smt. Meera Iyer",motherOccupation:"Music Teacher",
    siblings:"1 elder sister (married)",familyType:"Nuclear",familyValues:"Traditional",
    diet:"Vegetarian",drink:"No",smoke:"No",
    about:"Curious, calm and devoted to learning. Love Carnatic music, cooking, and temple visits.",
    partnerPref:"Age 28-33, PhD/Masters preferred, vegetarian, Iyer/Iyengar community.",
    photos:["https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600",
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600"],
    verified:false,status:"active",joined:"2026-03-22"
  },
  {
    id:"SM10006",name:"Vikram Singh",gender:"Male",dob:"1992-12-04",age:33,height:"5'11\"",
    religion:"Sikh",caste:"Jat",subCaste:"Sandhu",gotra:"-",manglik:"No",
    motherTongue:"Punjabi",rashi:"Dhanu (Sagittarius)",nakshatra:"Mool",
    city:"Chandigarh",state:"Punjab",country:"India",
    education:"MBBS, MD (Cardiology)",profession:"Doctor",company:"PGIMER Chandigarh",income:"₹28 LPA",
    fatherName:"S. Gurpreet Singh",fatherOccupation:"Farmer (Landlord)",
    motherName:"Sardarni Manjeet Kaur",motherOccupation:"Homemaker",
    siblings:"1 brother (NRI Canada)",familyType:"Joint",familyValues:"Traditional",
    diet:"Non-Vegetarian",drink:"No",smoke:"No",
    about:"Disciplined, family-loving and dedicated to my profession. Love Gurbani and morning runs.",
    partnerPref:"Age 27-31, educated, simple, family-oriented Sikh girl.",
    photos:["https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600"],
    verified:true,status:"active",joined:"2025-11-08"
  },
  {
    id:"SM10007",name:"Sneha Joshi",gender:"Female",dob:"1999-07-19",age:26,height:"5'2\"",
    religion:"Hindu",caste:"Brahmin",subCaste:"Deshastha",gotra:"Atri",manglik:"Yes",
    motherTongue:"Marathi",rashi:"Karka (Cancer)",nakshatra:"Pushya",
    city:"Pune",state:"Maharashtra",country:"India",
    education:"B.Arch, M.Arch",profession:"Architect",company:"Self-employed",income:"₹9 LPA",
    fatherName:"Shri Anant Joshi",fatherOccupation:"College Professor",
    motherName:"Smt. Smita Joshi",motherOccupation:"Bank Officer",
    siblings:"None",familyType:"Nuclear",familyValues:"Moderate",
    diet:"Vegetarian",drink:"No",smoke:"No",
    about:"Creative, independent, love sketching, Marathi literature and morning yoga.",
    partnerPref:"Age 26-31, professionally settled, supportive, Maharashtrian Brahmin preferred.",
    photos:["https://images.unsplash.com/photo-1521252659862-eec69941b071?w=600"],
    verified:true,status:"active",joined:"2026-02-28"
  },
  {
    id:"SM10008",name:"Rohan Kapoor",gender:"Male",dob:"1995-03-30",age:30,height:"5'9\"",
    religion:"Hindu",caste:"Khatri",subCaste:"Kapoor",gotra:"Bharadwaja",manglik:"No",
    motherTongue:"Hindi",rashi:"Mesha (Aries)",nakshatra:"Bharani",
    city:"Delhi",state:"Delhi",country:"India",
    education:"B.Com, CA",profession:"Finance Manager",company:"HDFC Bank",income:"₹22 LPA",
    fatherName:"Shri Ramesh Kapoor",fatherOccupation:"Businessman",
    motherName:"Smt. Anita Kapoor",motherOccupation:"Boutique Owner",
    siblings:"1 elder sister (married, in USA)",familyType:"Nuclear",familyValues:"Moderate",
    diet:"Vegetarian",drink:"No",smoke:"No",
    about:"Fun-loving, family-oriented, foodie. Enjoy Bollywood, board games and Sunday brunches.",
    partnerPref:"Age 25-29, graduate, vegetarian, Punjabi Khatri family preferred.",
    photos:["https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600"],
    verified:true,status:"active",joined:"2026-01-05"
  }
];

/* ---------- Dropdown options ---------- */
const OPTIONS = {
  religion:["Hindu","Sikh","Jain","Muslim","Christian","Buddhist","Parsi","Other"],
  caste:["Brahmin","Kshatriya","Vaishya","Patel","Reddy","Iyer","Iyengar","Khatri","Agarwal","Gupta","Yadav","Jat","Maratha","Nair","Kayastha","Other"],
  manglik:["No","Yes","Anshik (Partial)","Don't Know"],
  motherTongue:["Hindi","English","Punjabi","Gujarati","Marathi","Tamil","Telugu","Kannada","Malayalam","Bengali","Odia","Urdu","Other"],
  rashi:["Mesha (Aries)","Vrishabha (Taurus)","Mithun (Gemini)","Karka (Cancer)","Simha (Leo)","Kanya (Virgo)","Tula (Libra)","Vrishchika (Scorpio)","Dhanu (Sagittarius)","Makara (Capricorn)","Kumbha (Aquarius)","Meena (Pisces)"],
  diet:["Vegetarian","Non-Vegetarian","Eggetarian","Jain Vegetarian","Vegan"],
  drink:["No","Occasionally","Yes"],
  smoke:["No","Occasionally","Yes"],
  familyType:["Nuclear","Joint"],
  familyValues:["Traditional","Moderate","Liberal"],
  maritalStatus:["Never Married","Divorced","Widowed","Awaiting Divorce"],
  education:["High School","Diploma","B.A","B.Com","B.Sc","B.Tech","BBA","MBBS","CA","M.A","M.Com","M.Sc","M.Tech","MBA","PhD","Other"],
  profession:["Software Engineer","Doctor","Teacher","Banker","Engineer","Architect","Government Officer","Businessman","CA","Lawyer","Researcher","Designer","Student","Other"],
  income:["Below ₹2 LPA","₹2-5 LPA","₹5-10 LPA","₹10-20 LPA","₹20-50 LPA","Above ₹50 LPA"],
  height:["4'10\"","4'11\"","5'0\"","5'1\"","5'2\"","5'3\"","5'4\"","5'5\"","5'6\"","5'7\"","5'8\"","5'9\"","5'10\"","5'11\"","6'0\"","6'1\"","6'2\""],
  state:["Andhra Pradesh","Bihar","Delhi","Gujarat","Haryana","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Odisha","Punjab","Rajasthan","Tamil Nadu","Telangana","Uttar Pradesh","West Bengal","Chandigarh"]
};

/* ---------- LocalStorage helpers ---------- */
const Store = {
  KEY:"shubhmilan_state_v1",
  defaults(){return{
    user:null,                 // currently logged-in user (mock)
    profiles:SAMPLE_PROFILES,
    shortlist:[],              // ids
    interestsSent:[],          // {to, status}
    interestsReceived:[{from:"SM10002",status:"pending"},{from:"SM10004",status:"pending"}],
    messages:{                  // by profileId
      "SM10002":[{from:"them",text:"Hi Priya, namaste. I came across your profile.",t:"10:12 AM"},
                 {from:"me",text:"Hello Rahul, thank you for connecting!",t:"10:15 AM"}],
      "SM10004":[{from:"them",text:"Hi! Loved your profile. Would like to know more.",t:"Yesterday"}]
    },
    admins:[
      {id:"AD001",name:"Tom (Owner)",email:"support@tenderfy.org",role:"superadmin",status:"active"},
      {id:"AD002",name:"Anita Sharma",email:"anita@shubhmilan.in",role:"admin",status:"active"},
      {id:"AD003",name:"Ravi Kumar",email:"ravi@shubhmilan.in",role:"moderator",status:"active"}
    ],
    plans:[
      {id:"P0",name:"Free Forever",price:0,duration:"Lifetime",features:["Create profile","Browse profiles","Send 5 interests/month","Basic chat"],active:true,default:true},
      {id:"P1",name:"Silver",price:1499,duration:"3 Months",features:["All Free features","Unlimited interests","See who viewed you","Priority listing"],active:false},
      {id:"P2",name:"Gold",price:2999,duration:"6 Months",features:["All Silver features","Verified badge","Direct contact details","Personal relationship manager"],active:false},
      {id:"P3",name:"Platinum",price:4999,duration:"12 Months",features:["All Gold features","Profile highlight on top","Horoscope matching report","Dedicated wedding planner"],active:false}
    ],
    reports:[
      {id:"R001",reporter:"SM10003",against:"SM10006",reason:"Suspicious profile",status:"pending",date:"2026-04-10"},
      {id:"R002",reporter:"SM10005",against:"SM10008",reason:"Asking for money",status:"pending",date:"2026-04-12"}
    ],
    pendingApprovals:[
      {id:"SM10009",name:"Meena Krishnan",city:"Bangalore",submitted:"2026-04-15"},
      {id:"SM10010",name:"Aakash Bhatt",city:"Surat",submitted:"2026-04-16"}
    ]
  };},
  load(){
    try{
      const raw=localStorage.getItem(this.KEY);
      if(!raw){const d=this.defaults();this.save(d);return d;}
      return JSON.parse(raw);
    }catch(e){const d=this.defaults();this.save(d);return d;}
  },
  save(state){localStorage.setItem(this.KEY,JSON.stringify(state));},
  reset(){localStorage.removeItem(this.KEY);return this.load();}
};

/* ---------- Utilities ---------- */
function calcAge(dob){if(!dob)return"";const d=new Date(dob);const diff=Date.now()-d.getTime();return Math.floor(diff/(365.25*24*60*60*1000));}
function escapeHtml(s){return(s||"").toString().replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function findProfile(id){const s=Store.load();return s.profiles.find(p=>p.id===id);}
