export type LandingNavigationState = {
  pathname: string;
  internalLanding: boolean;
};

export function updateLandingNavigation(
  previous: LandingNavigationState,
  pathname: string
): LandingNavigationState {
  if (previous.pathname === pathname) return previous;
  return { pathname, internalLanding: pathname === "/" };
}

export function shouldRedirectLanding(
  authenticated: boolean,
  navigation: LandingNavigationState
) {
  return authenticated && navigation.pathname === "/" && !navigation.internalLanding;
}
