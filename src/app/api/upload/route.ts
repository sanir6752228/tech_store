import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";


export async function POST(
request: Request
){

try{


const formData = await request.formData();


const file = formData.get("file") as File;



if(!file){

return NextResponse.json(
{
error:"Файл не найден"
},
{
status:400
}
);

}



const bytes = await file.arrayBuffer();

const buffer = Buffer.from(bytes);



const filename =
Date.now()
+
"-"
+
file.name.replaceAll(" ","-");



const uploadPath =
path.join(
process.cwd(),
"public",
"uploads",
"products",
filename
);



await writeFile(
uploadPath,
buffer
);



return NextResponse.json({

url:
"/uploads/products/"+filename

});



}

catch(error){


console.log(error);


return NextResponse.json(
{
error:"Ошибка загрузки"
},
{
status:500
}
);


}

}