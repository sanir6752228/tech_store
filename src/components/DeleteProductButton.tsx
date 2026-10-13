"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";


export default function DeleteProductButton({
  id
}:{
  id:number
}){


const router = useRouter();


const [open,setOpen]=useState(false);

const [loading,setLoading]=useState(false);




async function removeProduct(){


setLoading(true);



const res = await fetch(

`/api/products/${id}`,

{
method:"DELETE"
}

);



if(res.ok){

setOpen(false);

router.refresh();

}
else{

alert("Ошибка удаления");

}



setLoading(false);


}





return(

<>


<button

onClick={()=>setOpen(true)}

className="
bg-red-500
hover:bg-red-600
text-white
px-4
py-2
rounded-xl
transition
"

>

Удалить

</button>






{
open && (

<div className="
fixed
inset-0
bg-black/50
flex
items-center
justify-center
z-50
">


<div className="
bg-white
rounded-3xl
p-8
w-[400px]
shadow-2xl
">


<h2 className="
text-2xl
font-black
mb-3
">

Удалить товар?

</h2>




<p className="
text-gray-500
mb-8
">

Вы действительно хотите удалить этот товар?
Это действие нельзя отменить.

</p>





<div className="
flex
justify-end
gap-3
">



<button

onClick={()=>setOpen(false)}

className="
px-5
py-3
rounded-xl
bg-gray-200
font-bold
"

>

Отмена

</button>





<button

onClick={removeProduct}

disabled={loading}

className="
px-5
py-3
rounded-xl
bg-red-500
hover:bg-red-600
text-white
font-bold
"

>


{
loading
?
"Удаление..."
:
"Удалить"
}


</button>




</div>



</div>



</div>

)

}



</>


)


}