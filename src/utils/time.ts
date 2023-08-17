const isRecentlyKicked = (kickDate: Date): boolean => {
  return kickDate.getTime() > Date.now() - 5 * 60 * 1000;
}