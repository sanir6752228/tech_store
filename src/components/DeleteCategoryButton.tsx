"use client";


import { useRouter } from "next/navigation";
import { useState } from "react";



export default function DeleteCategoryButton({

id

}:{

id:number

}){


const router = useRouter();


const [open,setOpen]=useState(false);

const [loading,setLoading]=useState(false);






async function removeCategory(){


setLoading(true);



const res = await fetch(

`/api/categories/${id}`,

{

method:"DELETE"

}

);





const data = await res.json();





if(res.ok){


setOpen(false);

router.refresh();


}
else{


alert(data.error || "Ошибка удаления");


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

font-bold

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

backdrop-blur-sm

flex

items-center

justify-center

z-50

">







<div className="

bg-white

rounded-3xl

p-8

w-[420px]

shadow-2xl

animate-in

zoom-in

duration-200

">







<div className="

flex

items-center

gap-4

mb-5

">





<div className="

w-14

h-14

rounded-2xl

bg-red-100

flex

items-center

justify-center

text-3xl

">

⚠️

</div>





<div>


<h2 className="

text-2xl

font-black

">

Удалить категорию?

</h2>


<p className="

text-gray-500

text-sm

">

Это действие нельзя отменить

</p>



</div>






</div>









<p className="

text-gray-600

mb-8

">

После удаления категория исчезнет из списка.
Товары в ней будут защищены от случайного удаления.

</p>








<div className="

flex

justify-end

gap-3

">





<button


onClick={()=>setOpen(false)}


disabled={loading}


className="

px-5

py-3

rounded-xl

bg-gray-200

hover:bg-gray-300

font-bold

transition

"


>


Отмена


</button>








<button


onClick={removeCategory}


disabled={loading}


className="

px-5

py-3

rounded-xl

bg-red-500

hover:bg-red-600

text-white

font-bold

transition

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