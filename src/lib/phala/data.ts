import type { IconName, Lang, Task } from "./types";

export const FEE = 5;
export const MIN = 10;
export const GOAL = 50;
export const RING = 213.6;

export const ICONS: Record<IconName, string> = {
  card:'<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 10h18M7 15h4"/>',
  shop:'<path d="M3 9l2-5h14l2 5"/><path d="M3 9a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0"/><path d="M5 12v8h14v-8M10 20v-4h4v4"/>',
  camera:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  bank:'<path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',
  doc:'<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M9.5 14l2 2 3.5-4"/>',
  coin:'<circle cx="12" cy="12" r="9"/><path d="M8.5 8h7M8.5 11.5h7M10 8c4.5 0 4.5 5 0 5l4.5 4"/>',
  pin:'<path d="M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  shield:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  award:'<circle cx="12" cy="9" r="5"/><path d="M9 13l-2 8 5-3 5 3-2-8"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  download:'<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  check:'<path d="M5 12l5 5 9-10"/>',
  close:'<path d="M6 6l12 12M18 6L6 18"/>',
  camAdd:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><path d="M12 10.5v5M9.5 13h5"/>'
};

export const T: Record<Lang, Record<string, string>> = {
  en:{
    tasks:'Tasks', pay:'Payment', profile:'Profile',
    greetM:'Good morning', greetA:'Good afternoon', greetE:'Good evening', name:'Ravi',
    bannerT:'Fill a form, earn ₹5', bannerS:'Accept a task, complete the form and your money is added instantly.',
    goal:'Daily goal', goalLeft:'₹{n} to go today', goalDone:'Goal reached. Great work!', ofGoal:'of ₹{g}',
    avail:'Available tasks', perForm:'per form', accept:'Accept', doneN:'{n} done',
    earnThis:'Complete this form to earn ₹5', submit:'Submit form', select:'Select', yes:'Yes', no:'No',
    addPhoto:'Tap to add photo', photoAdded:'Photo added', progress:'{n} of {m} filled',
    req:'This field is required', badPhone:'Enter a valid 10-digit mobile number', badNum:'Enter a number above 0',
    earned:'+₹5 added to your wallet', privacy:'Customer details are used only for this task.',
    discardQ:'Discard this form?', keep:'Keep editing', discard:'Discard', close:'Close',
    lifetime:'Lifetime earnings', withdrawn:'Withdrawn', withdrawable:'Withdrawable',
    minBtn:'Min ₹10 to withdraw', wBtn:'Withdraw to UPI',
    strip:'Earn <b>₹5</b> for every form you submit', history:'Work history',
    emptyH:'No work yet. Complete a task and it will show here.',
    formDone:'Form submitted', wdrawal:'Withdrawal to UPI', pending:'Processing', paid:'Paid',
    wTitle:'Withdraw money', wAmt:'Amount to withdraw', upiLabel:'Your UPI ID', badUpi:'Enter a valid UPI ID, e.g. name@upi',
    verifyUpi:'Verify UPI ID', verifying:'Verifying…', verifiedAs:'Verified: {n}', confirmW:'Confirm withdrawal',
    wOk:'On its way!', wOkSub:'₹{n} to {u}', demoNote:'Demo only. No real money moves.',
    pName:'Ravi Sharma', pPhone:'+91 98765 43210', pCity:'Jaipur, Rajasthan',
    pForms:'Forms done', pEarned:'Earned', pWith:'Withdrawn', pUpi:'UPI ID', pNone:'Not added', pLang:'Language',
    badges:'Badges', b1:'First form', b2:'₹10 club', b3:'First payout', locked:'Locked', unlocked:'Unlocked',
    logout:'Log out', logoutDemo:'Demo only: log out is disabled',
    demo:'Demo', stop:'Stop', reset:'Reset', offline:'You are offline. The app still works.',
    installT:'Install the app', installS:'Add Phala Sathhi to your home screen. Works offline too.', installBtn:'Install',
    iosS:'On iPhone: tap Share, then Add to Home Screen.', dismiss:'Dismiss',
    c_welcome:'Welcome! Tasks are published here for Phala Sathhi workers.',
    c_accept1:'Step 1: Worker accepts the Credit Card task',
    c_fill:'Fills in the customer lead form',
    c_submit:'Submits the form and earns ₹5',
    c_accept2:'Step 2: Accepts the D2C Shop Survey',
    c_pay:'Earnings land in the Payment tab',
    c_hist:'Work history lists every form and the ₹ earned',
    c_withdraw:'With ₹10 earned, worker withdraws to UPI',
    c_verify:'UPI ID is verified before money moves',
    c_wstatus:'Payout shows Processing, then Paid',
    c_profile:'Profile tracks forms, earnings and UPI',
    c_badges:'Badges unlock as the worker earns',
    c_lang:'The app also works in Hindi',
    c_done:'That is the Phala Sathhi journey!'
  },
  hi:{
    tasks:'कार्य', pay:'भुगतान', profile:'प्रोफ़ाइल',
    greetM:'शुभ प्रभात', greetA:'शुभ दोपहर', greetE:'शुभ संध्या', name:'रवि',
    bannerT:'फ़ॉर्म भरें, ₹5 कमाएँ', bannerS:'कार्य स्वीकार करें, फ़ॉर्म भरें और पैसे तुरंत जुड़ जाएँगे।',
    goal:'दैनिक लक्ष्य', goalLeft:'आज ₹{n} और कमाएँ', goalDone:'लक्ष्य पूरा। बहुत बढ़िया!', ofGoal:'₹{g} में से',
    avail:'उपलब्ध कार्य', perForm:'प्रति फ़ॉर्म', accept:'स्वीकार करें', doneN:'{n} पूरे',
    earnThis:'₹5 कमाने के लिए यह फ़ॉर्म भरें', submit:'फ़ॉर्म जमा करें', select:'चुनें', yes:'हाँ', no:'नहीं',
    addPhoto:'फ़ोटो जोड़ने के लिए दबाएँ', photoAdded:'फ़ोटो जुड़ गई', progress:'{m} में से {n} भरे गए',
    req:'यह जानकारी ज़रूरी है', badPhone:'सही 10 अंकों का मोबाइल नंबर डालें', badNum:'0 से अधिक संख्या डालें',
    earned:'+₹5 आपके वॉलेट में जुड़ गए', privacy:'ग्राहक की जानकारी केवल इसी कार्य के लिए उपयोग होती है।',
    discardQ:'यह फ़ॉर्म छोड़ दें?', keep:'भरना जारी रखें', discard:'छोड़ दें', close:'बंद करें',
    lifetime:'कुल कमाई', withdrawn:'निकाले गए', withdrawable:'निकालने योग्य',
    minBtn:'निकासी के लिए न्यूनतम ₹10', wBtn:'UPI में निकालें',
    strip:'हर फ़ॉर्म पर <b>₹5</b> कमाएँ', history:'काम का इतिहास',
    emptyH:'अभी कोई काम नहीं। कार्य पूरा करें, यहाँ दिखेगा।',
    formDone:'फ़ॉर्म जमा हुआ', wdrawal:'UPI में निकासी', pending:'प्रक्रिया में', paid:'भुगतान हुआ',
    wTitle:'पैसे निकालें', wAmt:'निकासी की राशि', upiLabel:'आपकी UPI ID', badUpi:'सही UPI ID डालें, जैसे name@upi',
    verifyUpi:'UPI ID जाँचें', verifying:'जाँच हो रही है…', verifiedAs:'सत्यापित: {n}', confirmW:'निकासी पक्की करें',
    wOk:'पैसे रास्ते में हैं!', wOkSub:'{u} पर ₹{n}', demoNote:'केवल डेमो। असली पैसे नहीं भेजे जाते।',
    pName:'रवि शर्मा', pPhone:'+91 98765 43210', pCity:'जयपुर, राजस्थान',
    pForms:'पूरे फ़ॉर्म', pEarned:'कमाई', pWith:'निकाले', pUpi:'UPI ID', pNone:'जोड़ा नहीं गया', pLang:'भाषा',
    badges:'बैज', b1:'पहला फ़ॉर्म', b2:'₹10 क्लब', b3:'पहली निकासी', locked:'बंद', unlocked:'खुल गया',
    logout:'लॉग आउट', logoutDemo:'केवल डेमो: लॉग आउट बंद है',
    demo:'डेमो', stop:'रोकें', reset:'रीसेट', offline:'आप ऑफ़लाइन हैं। ऐप फिर भी चलता है।',
    installT:'ऐप इंस्टॉल करें', installS:'फला साथी को होम स्क्रीन पर जोड़ें। ऑफ़लाइन भी चलता है।', installBtn:'इंस्टॉल',
    iosS:'iPhone पर: Share दबाएँ, फिर Add to Home Screen।', dismiss:'हटाएँ',
    c_welcome:'स्वागत है! यहाँ फला साथी के लिए कार्य प्रकाशित होते हैं।',
    c_accept1:'चरण 1: साथी क्रेडिट कार्ड कार्य स्वीकार करता है',
    c_fill:'ग्राहक का लीड फ़ॉर्म भरता है',
    c_submit:'फ़ॉर्म जमा करता है और ₹5 कमाता है',
    c_accept2:'चरण 2: D2C दुकान सर्वे स्वीकार करता है',
    c_pay:'कमाई भुगतान टैब में दिखती है',
    c_hist:'काम के इतिहास में हर फ़ॉर्म और कमाई दिखती है',
    c_withdraw:'₹10 होने पर साथी UPI में निकालता है',
    c_verify:'पैसे जाने से पहले UPI ID जाँची जाती है',
    c_wstatus:'निकासी पहले "प्रक्रिया में", फिर "भुगतान हुआ"',
    c_profile:'प्रोफ़ाइल में फ़ॉर्म, कमाई और UPI दिखते हैं',
    c_badges:'कमाई के साथ बैज खुलते जाते हैं',
    c_lang:'ऐप हिंदी में भी चलता है',
    c_done:'यही है फला साथी का सफ़र!'
  }
};

export const TASKS: Task[] = [
  { id:'card', ic:'card', bg:'#E5F6F4', fg:'#0A6A73',
    title:{en:'Credit Card Selling',hi:'क्रेडिट कार्ड बिक्री'},
    desc:{en:'Submit a customer lead interested in a credit card.',hi:'क्रेडिट कार्ड में रुचि रखने वाले ग्राहक की जानकारी भरें।'},
    meta:{en:'~2 min · Easy',hi:'~2 मिनट · आसान'},
    fields:[
      {k:'name',type:'text',label:{en:'Customer name',hi:'ग्राहक का नाम'},ph:{en:'e.g. Anita Verma',hi:'जैसे अनीता वर्मा'},demo:'Anita Verma'},
      {k:'phone',type:'tel',label:{en:'Customer mobile',hi:'ग्राहक का मोबाइल'},ph:{en:'10-digit number',hi:'10 अंकों का नंबर'},demo:'9876501234'},
      {k:'city',type:'text',label:{en:'City',hi:'शहर'},ph:{en:'e.g. Jaipur',hi:'जैसे जयपुर'},demo:'Jaipur'},
      {k:'ctype',type:'select',label:{en:'Card interested in',hi:'किस कार्ड में रुचि'},demo:2,opts:[
        {en:'Rewards card',hi:'रिवॉर्ड कार्ड'},{en:'Travel card',hi:'ट्रैवल कार्ड'},{en:'Cashback card',hi:'कैशबैक कार्ड'},{en:'Shopping card',hi:'शॉपिंग कार्ड'}]},
      {k:'income',type:'select',label:{en:'Monthly income',hi:'मासिक आय'},demo:1,opts:[
        {en:'Below ₹25,000',hi:'₹25,000 से कम'},{en:'₹25,000 – ₹50,000',hi:'₹25,000 – ₹50,000'},{en:'₹50,000 – ₹1,00,000',hi:'₹50,000 – ₹1,00,000'},{en:'Above ₹1,00,000',hi:'₹1,00,000 से ऊपर'}]}
    ]},
  { id:'survey', ic:'shop', bg:'#FFF1C9', fg:'#6B4300',
    title:{en:'D2C Shop Survey',hi:'D2C दुकान सर्वे'},
    desc:{en:'Survey a local shop about D2C brand demand.',hi:'स्थानीय दुकान से D2C ब्रांड की माँग पर सर्वे करें।'},
    meta:{en:'~3 min · Easy',hi:'~3 मिनट · आसान'},
    fields:[
      {k:'shop',type:'text',label:{en:'Shop name',hi:'दुकान का नाम'},ph:{en:'e.g. Shree Ganesh Store',hi:'जैसे श्री गणेश स्टोर'},demo:'Shree Ganesh Store'},
      {k:'cat',type:'select',label:{en:'Shop category',hi:'दुकान की श्रेणी'},demo:2,opts:[
        {en:'Kirana / Grocery',hi:'किराना / परचून'},{en:'Clothing',hi:'कपड़े'},{en:'Beauty & personal care',hi:'ब्यूटी और पर्सनल केयर'},{en:'Electronics',hi:'इलेक्ट्रॉनिक्स'}]},
      {k:'foot',type:'number',label:{en:'Customers per day',hi:'रोज़ ग्राहक'},ph:{en:'e.g. 120',hi:'जैसे 120'},demo:'120'},
      {k:'brands',type:'text',label:{en:'D2C brands you stock',hi:'कौन से D2C ब्रांड रखते हैं'},ph:{en:'e.g. Mamaearth, boAt',hi:'जैसे Mamaearth, boAt'},demo:'Mamaearth, boAt'},
      {k:'rating',type:'rating',label:{en:'Customer demand for D2C brands',hi:'D2C ब्रांड की ग्राहक माँग'},demo:4}
    ]},
  { id:'audit', ic:'camera', bg:'#FDE6E0', fg:'#A8321F',
    title:{en:'Product Shelf Audit',hi:'प्रोडक्ट शेल्फ ऑडिट'},
    desc:{en:'Check if our product is visible on the store shelf.',hi:'जाँचें कि हमारा प्रोडक्ट दुकान की शेल्फ पर दिख रहा है या नहीं।'},
    meta:{en:'~2 min · Easy',hi:'~2 मिनट · आसान'},
    fields:[
      {k:'store',type:'text',label:{en:'Store name',hi:'दुकान का नाम'},ph:{en:'e.g. Lakshmi Mart',hi:'जैसे लक्ष्मी मार्ट'},demo:'Lakshmi Mart'},
      {k:'shelf',type:'yesno',label:{en:'Our product visible on shelf?',hi:'क्या हमारा प्रोडक्ट शेल्फ पर दिखता है?'},demo:1},
      {k:'comp',type:'text',label:{en:'Competitor brands nearby',hi:'पास के प्रतिस्पर्धी ब्रांड'},ph:{en:'e.g. Brand A, Brand B',hi:'जैसे ब्रांड A, ब्रांड B'},demo:'Brand A, Brand B'},
      {k:'photo',type:'photo',label:{en:'Shelf photo',hi:'शेल्फ की फ़ोटो'},demo:1}
    ]}
];
