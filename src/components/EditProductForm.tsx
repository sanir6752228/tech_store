"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";


export default function EditProductForm({

product

}:{

product:any

}){


const router = useRouter();


const [loading,setLoading] = useState(false);


const [images,setImages] = useState<string[]>(

product.images || []

);





const [form,setForm] = useState({


name: product.name || "",

brand: product.brand || "",

model: product.model || "",


categoryId: String(product.categoryId || ""),


condition: product.condition || "Новый",


status: product.status || "В наличии",



memory: product.memory || "",

color: product.color || "",

battery: product.battery || "",



price: String(product.price || ""),


oldPrice: String(product.oldPrice || ""),



description: product.description || "",


telegramVideo: product.telegramVideo || "",



rating: String(product.rating || 5),

reviews: String(product.reviews || 0),

year: String(product.year || ""),

sales: String(product.sales || 0),



display: product.display || "",

processor: product.processor || "",

camera: product.camera || "",

sim: product.sim || "",



isNew: product.isNew || false,

isHit: product.isHit || false


});







function updateField(

field:string,

value:any

){


setForm(prev=>({

...prev,

[field]:value

}));

}

async function uploadImages(files:FileList){


const urls:string[]=[];


for(let i=0;i<files.length;i++){


const formData = new FormData();


formData.append(
"file",
files[i]
);



const res = await fetch(
"/api/upload",
{
method:"POST",
body:formData
}
);



const data = await res.json();



if(data.url){

urls.push(data.url);

}


}



setImages(prev=>[

...prev,

...urls

]);


}







function removeImage(index:number){


setImages(prev=>

prev.filter(

(_,i)=>i!==index

)

);


}








async function saveProduct(){


setLoading(true);



const res = await fetch(

`/api/products/${product.id}`,

{

method:"PUT",

headers:{

"Content-Type":"application/json"

},


body:JSON.stringify({

...form,


images,


price:Number(form.price),



oldPrice:

form.oldPrice

?

Number(form.oldPrice)

:

null,



rating:Number(form.rating),


reviews:Number(form.reviews),



year:

form.year

?

Number(form.year)

:

null,



sales:Number(form.sales)



})

}


);





if(res.ok){


router.push(
"/admin/products"
);


router.refresh();


}
else{


alert(
"Ошибка сохранения"
);


}



setLoading(false);


}









return(

<div className="
bg-white
rounded-3xl
p-10
shadow
space-y-10
">



<h1 className="
text-3xl
font-black
">

Редактирование товара

</h1>

<section>


<h2 className="
text-xl
font-black
mb-5
">

Основная информация

</h2>



<div className="
grid
md:grid-cols-3
gap-5
">


<Input

label="Название"

value={form.name}

onChange={(v)=>updateField("name",v)}

/>



<Input

label="Бренд"

value={form.brand}

onChange={(v)=>updateField("brand",v)}

/>



<Input

label="Модель"

value={form.model}

onChange={(v)=>updateField("model",v)}

/>



</div>


</section>








<section>


<h2 className="
text-xl
font-black
mb-5
">

Категория и состояние

</h2>



<div className="
grid
md:grid-cols-3
gap-5
">


<Input

label="ID категории"

value={form.categoryId}

onChange={(v)=>updateField("categoryId",v)}

/>




<Select

label="Состояние"

value={form.condition}

options={[
"Новый",
"Б/У",
"После ремонта"
]}

onChange={(v)=>
updateField("condition",v)
}

/>




<Select

label="Статус"

value={form.status}

options={[
"В наличии",
"Под заказ",
"Продан"
]}

onChange={(v)=>
updateField("status",v)
}

/>


</div>


</section>








<section>


<h2 className="
text-xl
font-black
mb-5
">

Характеристики

</h2>



<div className="
grid
md:grid-cols-3
gap-5
">


<Input

label="Память"

value={form.memory}

onChange={(v)=>updateField("memory",v)}

/>




<Input

label="Цвет"

value={form.color}

onChange={(v)=>updateField("color",v)}

/>




<Input

label="Батарея"

value={form.battery}

onChange={(v)=>updateField("battery",v)}

/>




<Input

label="Экран"

value={form.display}

onChange={(v)=>updateField("display",v)}

/>




<Input

label="Процессор"

value={form.processor}

onChange={(v)=>updateField("processor",v)}

/>




<Input

label="Камера"

value={form.camera}

onChange={(v)=>updateField("camera",v)}

/>




<Input

label="SIM"

value={form.sim}

onChange={(v)=>updateField("sim",v)}

/>



</div>


</section>







<section>


<h2 className="
text-xl
font-black
mb-5
">

Цена

</h2>


<div className="
grid
md:grid-cols-2
gap-5
">


<Input

label="Цена"

value={form.price}

onChange={(v)=>updateField("price",v)}

/>




<Input

label="Старая цена"

value={form.oldPrice}

onChange={(v)=>updateField("oldPrice",v)}

/>


</div>


</section>

<section>


<h2 className="
text-xl
font-black
mb-5
">

Дополнительно

</h2>



<div className="
grid
md:grid-cols-4
gap-5
">


<Input

label="Рейтинг"

value={form.rating}

onChange={(v)=>updateField("rating",v)}

/>



<Input

label="Отзывы"

value={form.reviews}

onChange={(v)=>updateField("reviews",v)}

/>



<Input

label="Год"

value={form.year}

onChange={(v)=>updateField("year",v)}

/>



<Input

label="Продажи"

value={form.sales}

onChange={(v)=>updateField("sales",v)}

/>


</div>





<div className="
flex
gap-8
mt-6
">


<label className="
flex
gap-3
font-bold
">


<input

type="checkbox"

checked={form.isNew}

onChange={(e)=>

updateField(
"isNew",
e.target.checked
)

}

/>


Новинка

</label>





<label className="
flex
gap-3
font-bold
">


<input

type="checkbox"

checked={form.isHit}

onChange={(e)=>

updateField(
"isHit",
e.target.checked
)

}

/>


Хит продаж

</label>



</div>


</section>








<section>


<h2 className="
text-xl
font-black
mb-5
">

Фотографии

</h2>




<input

type="file"

multiple

accept="image/*"

onChange={(e)=>{


if(e.target.files){

uploadImages(
e.target.files
);

}


}}


className="
border
rounded-xl
p-3
w-full
"

/>





<div className="
flex
flex-wrap
gap-5
mt-5
">


{

images.map((img,index)=>(


<div

key={img}

className="
relative
">


<img

src={img}

className="
w-32
h-32
rounded-2xl
object-cover
border
"

/>





<button

type="button"

onClick={()=>removeImage(index)}

className="
absolute
right-2
top-2
bg-red-500
text-white
rounded-full
w-8
h-8
font-black
"

>

×

</button>



</div>


))


}


</div>


</section>








<section>


<h2 className="
text-xl
font-black
mb-5
">

Telegram видео

</h2>



<Input

label="Ссылка на видео"

value={form.telegramVideo}

onChange={(v)=>
updateField(
"telegramVideo",
v
)
}

/>


</section>








<section>


<h2 className="
text-xl
font-black
mb-5
">

Описание

</h2>



<textarea

value={form.description}

onChange={(e)=>

updateField(
"description",
e.target.value
)

}

className="
w-full
h-40
border
rounded-xl
p-5
"

/>


</section>








<button

onClick={saveProduct}

disabled={loading}

className="
bg-green-500
hover:bg-green-600
text-white
px-10
py-4
rounded-xl
font-black
text-lg
"

>


{

loading

?

"Сохранение..."

:

"Сохранить товар"

}


</button>





</div>

)

}









function Input({

label,

value,

onChange

}:{

label:string;

value:string;

onChange:(v:string)=>void;

}){


return(

<div>


<label className="
block
font-bold
mb-2
">

{label}

</label>


<input

value={value}

onChange={(e)=>
onChange(e.target.value)
}

className="
w-full
border
rounded-xl
px-4
py-3
"

 />



</div>

)

}









function Select({

label,

value,

options,

onChange

}:{

label:string;

value:string;

options:string[];

onChange:(v:string)=>void;

}){


return(

<div>


<label className="
block
font-bold
mb-2
">

{label}

</label>



<select

value={value}

onChange={(e)=>
onChange(e.target.value)
}

className="
w-full
border
rounded-xl
px-4
py-3
"

>


{

options.map(item=>(

<option

key={item}

value={item}

>

{item}

</option>


))

}


</select>


</div>

)

}