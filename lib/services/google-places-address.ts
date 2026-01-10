export type AddressComponentLike = {
  long_name: string;
  short_name: string;
  types: readonly string[];
};

export type ParsedAddressComponents = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  postalCodeSuffix?: string;
};

/**
 * Parse address_components from Google Places Place Details into structured fields.
 *
 * Note: This implementation is intentionally "google-maps-types free" so it can be
 * used in server/CI contexts without DOM/global `google` type dependencies.
 */
export function parseAddressComponents(
  addressComponents: readonly AddressComponentLike[] | undefined
): ParsedAddressComponents | null {
  if (!addressComponents || addressComponents.length === 0) return null;

  let streetNumber = "";
  let route = "";
  let subpremise = "";
  let city = "";
  let state = "";
  let postalCode = "";
  let postalCodeSuffix = "";

  for (const component of addressComponents) {
    const types = component.types;
    const longName = component.long_name;
    const shortName = component.short_name;

    if (types.includes("street_number")) {
      streetNumber = longName;
    } else if (types.includes("route")) {
      route = longName;
    } else if (types.includes("subpremise")) {
      subpremise = longName;
    } else if (types.includes("locality")) {
      city = longName;
    } else if (types.includes("sublocality_level_1") && !city) {
      city = longName;
    } else if (types.includes("administrative_area_level_1")) {
      state = shortName;
    } else if (types.includes("postal_code")) {
      postalCode = longName;
    } else if (types.includes("postal_code_suffix")) {
      postalCodeSuffix = longName;
    }
  }

  const line1 = streetNumber && route ? `${streetNumber} ${route}` : route || streetNumber;
  if (!line1 || !city || !state || !postalCode) return null;

  return {
    line1,
    line2: subpremise || undefined,
    city,
    state,
    postalCode,
    postalCodeSuffix: postalCodeSuffix || undefined,
  };
}

