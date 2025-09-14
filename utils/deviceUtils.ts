export const getDeviceName = (): string => {
  const ua = navigator.userAgent;
  let browserName = "Unknown Browser";
  let osName = "Unknown OS";
  if (ua.indexOf("Win") !== -1) osName = "Windows";
  if (ua.indexOf("Mac") !== -1) osName = "MacOS";
  if (ua.indexOf("Linux") !== -1) osName = "Linux";
  if (ua.indexOf("Android") !== -1) osName = "Android";
  if (ua.indexOf("like Mac") !== -1) osName = "iOS";
  if (ua.indexOf("Chrome") !== -1 && ua.indexOf("Edg") === -1) browserName = "Chrome";
  else if (ua.indexOf("Firefox") !== -1) browserName = "Firefox";
  else if (ua.indexOf("Safari") !== -1 && ua.indexOf("Chrome") === -1) browserName = "Safari";
  else if (ua.indexOf("Edg") !== -1) browserName = "Edge";
  return `${browserName} on ${osName}`;
};
