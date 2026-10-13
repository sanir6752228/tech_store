"use client";

import {useEffect,useState} from "react";


export default function CartButton({

id,
type

}:{

id:number;
type:"single"|"stock";

}){


const [added,setAdded]=useState(false);



useEffect(()=>{


const cart=JSON.parse(

localStorage.getItem("cart") || "[]"

);


setAdded(

cart.some(
(item:any)=>item.id===id
)

);


},[id]);






function toggleCart(){


let cart=JSON.parse(

localStorage.getItem("cart") || "[]"

);





const exists=cart.find(

(item:any)=>item.id===id

);





if(exists){


cart=cart.filter(

(item:any)=>item.id!==id

);


}

else{


cart.push({

id,

quantity:1,

type

});


}




localStorage.setItem(

"cart",

JSON.stringify(cart)

);



setAdded(!exists);


window.dispatchEvent(
new Event("cartUpdated")
);


}






return(

<button

onClick={(e)=>{

e.preventDefault();

e.stopPropagation();

toggleCart();

}}

className={`

w-full

py-3

rounded-xl

font-bold

transition

${

added

?

"bg-gray-200 text-gray-800"

:

"bg-green-500 text-white"

}

`}

>


{

added

?

"✓ В корзине"

:

"🛒 Купить"

}


</button>


)


}