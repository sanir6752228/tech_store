const benefits = [

{
icon:"🚚",
title:"Быстрая доставка",
text:"Доставка техники по всей стране"
},


{
icon:"🛡",
title:"Гарантия качества",
text:"Проверяем каждый товар перед продажей"
},


{
icon:"🔧",
title:"Сервисный центр",
text:"Ремонт смартфонов и другой техники"
},


{
icon:"↩",
title:"Возврат",
text:"Удобные условия возврата"
}


]


export default function Benefits(){


return(

<section className="
px-10
py-8
">


<div className="
grid
grid-cols-1
md:grid-cols-2
xl:grid-cols-4
gap-6
">



{
benefits.map((item)=>(


<div

key={item.title}

className="
bg-white
rounded-3xl
p-6
border
hover:shadow-xl
hover:border-green-400
transition
flex
gap-5
items-center
"

>


<div className="
text-5xl
">

{item.icon}

</div>



<div>


<h3 className="
font-black
text-xl
">

{item.title}

</h3>


<p className="
text-gray-500
mt-2
">

{item.text}

</p>


</div>



</div>


))

}



</div>


</section>

)

}