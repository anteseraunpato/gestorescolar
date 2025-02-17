 import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { Class, Prisma, Subject, Teacher } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { role } from "@/lib/utils";

type TeacherList = Teacher & {subjects:Subject[]} & {classes:Class[]};

const columns = [
  {
    header: "Nombre",
    accessor: "info",
  },
  {
    header: "ID Docente",
    accessor: "teacherId",
    className: "hidden md:table-cell",
  },
  {
    header: "Materias",
    accessor: "subjects",
    className: "hidden md:table-cell",
  },
  {
    header: "Grupos",
    accessor: "classes",
    className: "hidden md:table-cell",
  },
  {
    header: "Teléfono",
    accessor: "phone",
    className: "hidden lg:table-cell",
  },
  {
    header: "Dirección",
    accessor: "address",
    className: "hidden lg:table-cell",
  },
    ...(role === "admin"?[{
      header: "Actions",
      accessor: "action",
    }] : []),
  ];

const renderRow = (item: TeacherList) => (
  <tr
    key={item.id}
    className="border-b border-gray-200 even:bg-verdedos-900 text-sm hover:bg-hueso-950"
  >
    <td className="flex items-center gap-4 p-4">
      <Image
        src={item.img || "/avatar2.png"}
        alt=""
        width={40}
        height={40}
        className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
      />
      <div className="flex flex-col">
        <h3 className="font-semibold">{item.name}</h3>
        <p className="text-xs text-gray-500">{item?.email}</p>
      </div>
    </td>
    <td className="hidden md:table-cell">{item.username}</td>
    <td className="hidden md:table-cell">{item.subjects.map((subjet)=>subjet.name).join(",")}</td>
    <td className="hidden md:table-cell">{item.classes.map((classItem)=>classItem.name).join(",")}</td>
    <td className="hidden md:table-cell">{item.phone}</td>
    <td className="hidden md:table-cell">{item.address}</td>
    <td>
      <div className="flex items-center gap-2">
        <Link href={`/list/docentes/${item.id}`}>
          <button className="w-7 h-7 flex items-center justify-center rounded-full bg-verdedos-500">
            <Image src="/view.png" alt="" width={16} height={16} />
          </button>
        </Link>
        {role === "admin" && (
          // <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple">
          //   <Image src="/delete.png" alt="" width={16} height={16} />
          // </button>
          <FormModal table="teacher" type="delete" id={item.id}/>
        )}
      </div>
    </td>
  </tr>
);
const TeacherListPage = async ({
  searchParams,
}:{
  searchParams:{[key:string]:string |undefined};
}) => {
  const {page, ...queryParams} =searchParams;
  const p = page? parseInt(page) :1;
  //URL PARAMS CONDITION
  const query: Prisma.TeacherWhereInput= {};
  if(queryParams){
    for (const[key, value] of Object.entries(queryParams)){
      if (value !== undefined){
        switch (key){
          case "classId":
              query.lessons = {
                some: {
                  classId : parseInt(value),
                },
              };
              break;
              case"search":
              query.name = {contains:value, mode:"insensitive"};
              break;
              default:
                break;
            }
          }
        }
      }
    
  const [data,count] = await prisma.$transaction([

   prisma.teacher.findMany({
    where:query,
    include:{
      subjects:true,
      classes:true,
    },
    take:ITEM_PER_PAGE,
    skip:ITEM_PER_PAGE * (p - 1),
  }),
   prisma.teacher.count({where:query}),
]);
  
  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Lista de maestros</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-verdedos-950">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-verdedos-950">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && (
              // <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              //   <Image src="/plus.png" alt="" width={14} height={14} />
              // </button>
              <FormModal table="teacher" type="create"/>
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* PAGINACIÓN */}
      <Pagination page={p} count={count}/>
    </div>
  );
};

export default TeacherListPage;
