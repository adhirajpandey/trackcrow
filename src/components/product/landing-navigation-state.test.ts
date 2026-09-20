import { shouldRedirectLanding, updateLandingNavigation } from "./landing-navigation-state";

describe("landing navigation", () => {
  const initial = { pathname: "/", internalLanding: false };

  it("redirects only authenticated initial visits", () => {
    expect(shouldRedirectLanding(true, initial)).toBe(true);
    expect(shouldRedirectLanding(false, initial)).toBe(false);
  });

  it.each(["/dashboard", "/transactions/new", "/settings", "/login"])(
    "allows internal navigation from %s",
    (pathname) => {
      const home = updateLandingNavigation({ pathname, internalLanding: false }, "/");
      expect(shouldRedirectLanding(true, home)).toBe(false);
      expect(updateLandingNavigation(home, "/")).toBe(home);
    }
  );

  it("supports repeated trips and history navigation without persisting across reloads", () => {
    const dashboard = updateLandingNavigation(initial, "/dashboard");
    const home = updateLandingNavigation(dashboard, "/");
    const nextDashboard = updateLandingNavigation(home, "/dashboard");
    expect(shouldRedirectLanding(true, nextDashboard)).toBe(false);
    expect(shouldRedirectLanding(true, updateLandingNavigation(nextDashboard, "/"))).toBe(false);
    expect(shouldRedirectLanding(true, initial)).toBe(true);
  });
});
