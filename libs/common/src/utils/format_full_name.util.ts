export const formatFullName = (fullName: string): string => {
  let out = '';
  fullName = (fullName || '').replace(/^\s+|\s+$/g, '').toLowerCase();

  for (let name of fullName.split(/\s+/)) {
    if (!name.match(/^(d[ao]s?|e|de|del)$/))
      name = name.substr(0, 1).toUpperCase() + name.substr(1).toLowerCase();
    if (
      name.match(/^x{0,3}(i{1,3}|iv|vi{0,3})$/i) &&
      fullName.substr(-name.length) == name.toLowerCase()
    )
      name = name.toUpperCase();
    const compoundName = name.match(/^(\S+)-(\S+)$/);
    if (compoundName) {
      name =
        compoundName[1].substr(0, 1).toUpperCase() +
        compoundName[1].substr(1).toLowerCase() +
        '-' +
        compoundName[2].substr(0, 1).toUpperCase() +
        compoundName[2].substr(1).toLowerCase();
    }
    if (name.match(/^D'/))
      name =
        name.substr(0, 2).toLowerCase() +
        name.substr(2, 1).toUpperCase() +
        name.substr(3).toLowerCase();
    out = out + name + ' ';
  }
  return out.substr(0, out.length - 1);
};
