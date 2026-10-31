/** Whether `url` points at the public Galaxy (galaxy.ansible.com or one of its subdomains). */
export const isPublicGalaxyUrl = (url: string): boolean => {
  try {
    // Compare the parsed host: a pattern match anywhere in the URL also matches other hosts.
    const { hostname } = new URL(url);
    return (
      hostname === "galaxy.ansible.com" ||
      hostname.endsWith(".galaxy.ansible.com")
    );
  } catch {
    return false;
  }
};
