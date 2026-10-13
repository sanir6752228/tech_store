import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";



type Props = {
  params: Promise<{
    id: string;
  }>;
};



// GET один товар

export async function GET(
  request: Request,
  { params }: Props
) {


  try {


    const { id } = await params;



    const product = await prisma.product.findUnique({

      where:{
        id:Number(id)
      },

      include:{
        category:true
      }

    });



    if(!product){

      return NextResponse.json(
        {
          error:"Товар не найден"
        },
        {
          status:404
        }
      );

    }



    return NextResponse.json(product);



  } catch(error){


    console.log(error);


    return NextResponse.json(
      {
        error:"Ошибка загрузки товара"
      },
      {
        status:500
      }
    );


  }

}







// PUT обновление

export async function PUT(

request:Request,

{params}:Props

){


try{


const {id}=await params;


const body=await request.json();



const product=await prisma.product.update({

where:{
id:Number(id)
},


data:{


name:body.name,

brand:body.brand,

model:body.model,


categoryId:Number(body.categoryId),


condition:body.condition,


status:body.status,


memory:body.memory,


color:body.color,


battery:body.battery,


price:Number(body.price),


oldPrice:
body.oldPrice
?
Number(body.oldPrice)
:
null,


description:body.description,


images:body.images ?? [],


telegramVideo:body.telegramVideo


}


});



return NextResponse.json(product);



}

catch(error){


console.log(error);


return NextResponse.json(
{
error:"Ошибка обновления"
},
{
status:500
}
);


}


}









// DELETE

export async function DELETE(

request:Request,

{params}:Props

){


try{


const {id}=await params;



await prisma.product.delete({

where:{
id:Number(id)
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
error:"Ошибка удаления"
},
{
status:500
}
);


}


}