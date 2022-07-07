const deproxy = (solid_proxy) => {
  try {
    if (!solid_proxy) return false;
    return JSON.parse(JSON.stringify(solid_proxy));
  } catch (err) {
    return false
  }
}
export default deproxy;