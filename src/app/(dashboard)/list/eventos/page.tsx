import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { currentUserId, role } from "@/lib/utils";
import { Class, Event, Prisma } from "@prisma/client";
import Image from "next/image";

type EventList = Event & { class: Class };

const columns = [
  {
    header: "Titulo",
    accessor: "title",
  },
  {
    header: "Grupo",
    accessor: "class",
  },
  {
    header: "Fecha",
    accessor: "date",
    className: "hidden md:table-cell",
  },
  {
    header: "Inicio",
    accessor: "startTime",
    className: "hidden md:table-cell",
  },
  {
    header: "Final",
    accessor: "endTime",
    className: "hidden md:table-cell",
  },
  ...(role === "admin" ?[{
    header: "Acciones",
    accessor: "action",
  }] : []),
];

  const renderRow = (item: EventList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-verdedos-900 text-sm hover:bg-hueso-950"
    >
      <td className="flex items-center gap-4 p-4">{item.title}</td>
      <td>{item.class?.name || "-"}</td>
      <td className="hidden md:table-cell">{new Intl.DateTimeFormat("es-MX").format(item.startTime)}</td>
      <td className="hidden md:table-cell">{item.startTime.toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })}</td>
      <td className="hidden md:table-cell">{item.endTime.toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })}</td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormModal table="event" type="update" data={item} />
              <FormModal table="event" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

const EventListPage = async ({

  searchParams,
}:{
  searchParams:{[key:string]:string |undefined};
}) => {
  const {page, ...queryParams} =searchParams;
  const p = page? parseInt(page) :1;
  //URL PARAMS CONDITION
  const query: Prisma.EventWhereInput= {};
  if(queryParams){
    for (const[key, value] of Object.entries(queryParams)){
      if (value !== undefined){
        switch (key){
          case"search":
              query.title = {contains:value, mode:"insensitive"};
              break;

            default:
            break;
            }
          }
        }
      }

      // ROLE CONDITIONS

      const roleConditions = {
        teacher: {lessons:{some:{teacherId: currentUserId!}}},

        student: {students:{some:{id:currentUserId!}}}
      };

      query.OR =[{classId:null},{
        class:roleConditions[role as keyof typeof roleConditions] || {}
      }]
    
  const [data,count] = await prisma.$transaction([

   prisma.event.findMany({
    where:query,
    include:{
          class: true,
      },
    take:ITEM_PER_PAGE,
    skip:ITEM_PER_PAGE * (p - 1),
  }),
   prisma.event.count({where:query}),
]);


  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Lista de eventos</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-verdedos-950">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-verdedos-950">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && <FormModal table="event" type="create" />}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* PAGINATION */}
      <Pagination page={p} count={count}/>
    </div>
  );
};

export default EventListPage;
