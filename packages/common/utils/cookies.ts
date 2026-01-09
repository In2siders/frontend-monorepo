const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');

  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

const setCookie = (name: string, value: string, days: number = 7): void => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "; expires=" + date.toUTCString();

  document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

const deleteCookie = (name: string): void => {
  setCookie(name, "", -1);
}

export { getCookie, setCookie, deleteCookie }
