
export function useStringHelper() {

  const objectToQueryString = (obj: any) => {
    return Object.keys(obj).map(key => key + '=' + obj[key]).join('&');
  }

  return { objectToQueryString };
}