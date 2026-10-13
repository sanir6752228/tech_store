export default function Banner(){

return(

<section className="
px-10
py-8
">


<div className="
relative
overflow-hidden
bg-gradient-to-br
from-black
via-gray-950
to-green-950
rounded-3xl
min-h-[520px]
px-14
py-12
flex
items-center
justify-between
">


{/* Левая часть */}

<div className="
max-w-xl
z-10
">


<div className="
inline-block
bg-green-400
text-black
font-bold
px-5
py-2
rounded-full
mb-6
">

НОВИНКА

</div>




<h1 className="
text-white
text-7xl
font-black
leading-none
">


iPhone 16 Pro

<br/>


<span className="
text-green-400
">

Уже в наличии

</span>


</h1>




<p className="
text-gray-300
text-xl
mt-8
max-w-lg
">

Новый уровень производительности,
камеры и дизайна.

</p>




<div className="
flex
gap-5
mt-10
">


<button className="
bg-green-400
hover:bg-green-500
transition
text-black
font-bold
px-10
py-5
rounded-2xl
text-lg
">

Перейти к покупкам →

</button>


</div>


</div>






{/* Телефон */}

<div className="
relative
mr-10
">


<div className="
absolute
inset-0
bg-green-400
blur-3xl
opacity-30
rounded-full
">

</div>




<div className="
relative
text-[260px]
">

📱

</div>



</div>






{/* Характеристики справа */}

<div className="
absolute
right-10
top-1/2
translate-y-[-50%]
hidden
xl:block
space-y-8
">


<div className="
text-white
flex
gap-4
items-center
">


<div className="
text-green-400
text-3xl
">

⚡

</div>


<div>

<p className="font-bold text-xl">
A18 Pro
</p>

<p className="text-gray-400">
Новый чип
</p>


</div>


</div>





<div className="
text-white
flex
gap-4
items-center
">


<div className="
text-green-400
text-3xl
">

📷

</div>


<div>

<p className="font-bold text-xl">
48 Мп
</p>

<p className="text-gray-400">
Профессиональная камера
</p>


</div>


</div>





<div className="
text-white
flex
gap-4
items-center
">


<div className="
text-green-400
text-3xl
">

🔋

</div>


<div>

<p className="font-bold text-xl">
33 часа
</p>

<p className="text-gray-400">
Автономной работы
</p>


</div>


</div>



</div>



</div>


</section>


)

}