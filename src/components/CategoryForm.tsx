"use client";


import {useState} from "react";
import {useRouter} from "next/navigation";



export default function CategoryForm(){


const router = useRouter();


const [name,setName]=useState("");

const [loading,setLoading]=useState(false);





async function create(){


if(!name)return;



setLoading(true);



await fetch("/api/categories",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

name

})

});



setName("");

setLoading(false);


router.refresh();


}





return(


<div className="
bg-white
rounded-3xl
p-6
shadow
mb-8
">


<h2 className="
text-xl
font-bold
mb-4
">

Добавить категорию

</h2>





<div className="
flex
gap-4
">


<input

value={name}

onChange={(e)=>
setName(e.target.value)
}

placeholder="Например: Телефоны"

className="
border
rounded-xl
px-5
py-3
flex-1
"

/>





<button

onClick={create}

disabled={loading}

className="
bg-green-500
text-white
px-6
rounded-xl
font-bold
"

>

{
loading
?
"Добавление..."
:
"Добавить"
}


</button>



</div>



</div>


)


}