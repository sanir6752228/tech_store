import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";




// GET товары с поиском, фильтрами и сортировкой

export async function GET(
request:Request
){


try{


const {searchParams}=new URL(request.url);



const search = searchParams.get("search") || "";

const status = searchParams.get("status") || "";

const categoryId = searchParams.get("categoryId") || "";

const sort = searchParams.get("sort") || "";





const products = await prisma.product.findMany({



where:{


AND:[



search
?
{

OR:[


{
name:{
contains:search,
mode:"insensitive"
}
},


{
brand:{
contains:search,
mode:"insensitive"
}
},


{
model:{
contains:search,
mode:"insensitive"
}

}


]

}

:

{},





categoryId

?

{
categoryId:Number(categoryId)
}

:

{},





status

?

{
status:status
}

:

{}




]


},





include:{


category:true


},




orderBy:

sort==="price_asc"

?

{
price:"asc"
}


:

sort==="price_desc"

?

{
price:"desc"
}


:

{
createdAt:"desc"
}




});





return NextResponse.json(products);



}

catch(error){


console.log(error);



return NextResponse.json(

{
error:"Ошибка загрузки товаров"
},

{
status:500
}

);



}



}









// СОЗДАНИЕ ТОВАРА


export async function POST(
request:Request
){

try {


const body = await request.json();



const product = await prisma.product.create({

data:{



name:body.name,


brand:body.brand,


model:body.model,



categoryId:Number(body.categoryId),



condition:body.condition,



status:body.status,



memory:body.memory || null,


color:body.color || null,


battery:body.battery || null,



price:Number(body.price),



oldPrice:

body.oldPrice

?

Number(body.oldPrice)

:

null,



description:body.description || null,



images:body.images ?? [],



telegramVideo:

body.telegramVideo || null



}



});





return NextResponse.json(product);



}

catch(error){


console.log(error);



return NextResponse.json(

{
error:"Ошибка создания товара"
},

{
status:500
}

);



}

}