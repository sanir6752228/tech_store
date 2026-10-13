"use client";


import { useRouter } from "next/navigation";
import { useState } from "react";



export default function EditCategoryForm({

category

}:{

category:any

}){


const router = useRouter();


const [name,setName]=useState(category.name);

const [loading,setLoading]=useState(false);





async function save(){


setLoading(true);



const res = await fetch(

`/api/categories/${category.id}`,

{

method:"PUT",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

name

})

}

);




if(res.ok){

router.push("/admin/categories");

router.refresh();

}

else{

alert("Ошибка сохранения");

}



setLoading(false);


}






return(


<div className="
bg-white
rounded-3xl
p-10
max-w-xl
shadow
">



<label className="
font-bold
block
mb-2
">

Название категории

</label>




<input

value={name}

onChange={(e)=>setName(e.target.value)}

className="
w-full
border
rounded-xl
px-5
py-3
mb-6
"

/>







<button

onClick={save}

disabled={loading}

className="
bg-green-500
hover:bg-green-600
text-white
px-8
py-3
rounded-xl
font-bold
"

>


{

loading

?

"Сохранение..."

:

"Сохранить"

}


</button>





</div>


)


}