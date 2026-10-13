import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";



// получить категории

export async function GET(){


try{


const categories = await prisma.category.findMany({

include:{
_count:{
select:{
products:true
}
}
},

orderBy:{
id:"desc"
}

});


return NextResponse.json(categories);



}

catch(error){


return NextResponse.json(
{
error:"Ошибка загрузки категорий"
},
{
status:500
}
);


}


}








// создать категорию

export async function POST(
request:Request
){


try{


const body = await request.json();



const category = await prisma.category.create({

data:{


name:body.name,


slug:
body.name
.toLowerCase()
.replaceAll(" ","-")


}

});



return NextResponse.json(category);



}

catch(error){


return NextResponse.json(

{
error:"Ошибка создания категории"
},

{
status:500
}

);


}


}