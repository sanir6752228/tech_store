import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";



type Props = {
params: Promise<{
id:string
}>
};


export async function PUT(

request:Request,

{
params
}:Props

){


const {id}=await params;


const body=await request.json();



const category = await prisma.category.update({

where:{
id:Number(id)
},


data:{


name:body.name,


slug:body.name
.toLowerCase()
.replaceAll(" ","-")


}


});



return NextResponse.json(category);


}


export async function DELETE(
request:Request,
{params}:Props
){


try{


const {id}=await params;



const categoryId=Number(id);




// проверяем товары

const products = await prisma.product.count({

where:{
categoryId
}

});




if(products > 0){


return NextResponse.json(

{
error:"Нельзя удалить категорию, в ней есть товары"
},

{
status:400
}

);


}





await prisma.category.delete({

where:{
id:categoryId
}

});





return NextResponse.json({

success:true

});




}

catch(error){


console.log(error);



return NextResponse.json(

{
error:"Ошибка удаления категории"
},

{
status:500
}

);


}


}