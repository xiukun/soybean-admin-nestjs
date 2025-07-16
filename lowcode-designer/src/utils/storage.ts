export function removeItemsFromLocalStorage(pattern: RegExp) {
  let i = 0;
  while (i < localStorage.length) {
    let key = localStorage.key(i) as string;
    if (pattern.test(key)) {
      localStorage.removeItem(key);
    } else {
      i++;
    }
  }
}
