export const toTitleCase = (str: string) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const formatName = (name: string) => toTitleCase(name);

export const formatStudentData = (student: any) => {
  if (!student) return student;
  return {
    ...student,
    name: toTitleCase(student.name || ''),
    fatherName: toTitleCase(student.fatherName || ''),
    motherName: toTitleCase(student.motherName || ''),
  };
};

export const formatFacultyData = (faculty: any) => {
  if (!faculty) return faculty;
  return {
    ...faculty,
    name: toTitleCase(faculty.name || ''),
  };
};
