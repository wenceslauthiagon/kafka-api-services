import * as xlsx from 'xlsx';

export const generateWorksheet = (
  data: any[],
  name: string,
  tabName = name,
) => {
  // create workbook
  const workbook = xlsx.utils.book_new();

  // create each worksheet and append it at woorkbook
  data.forEach((value: any, index: number) => {
    const worksheet = xlsx.utils.json_to_sheet(value);
    const nameOfTab = `${tabName}${index + 1}`;
    xlsx.utils.book_append_sheet(workbook, worksheet, nameOfTab);
  });

  // write worksheet
  xlsx.writeFile(workbook, name);
};
