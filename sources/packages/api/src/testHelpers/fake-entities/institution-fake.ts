import * as faker from "faker";
import { Institution } from "../../database/entities";

export function createFakeInstitution(): Institution {
  const institution = new Institution();
  institution.guid = faker.random.uuid();
  institution.legalOperatingName = faker.company.companyName();
  institution.operatingName = faker.company.companySuffix();
  institution.primaryPhone = faker.phone.phoneNumber();
  institution.primaryEmail = faker.internet.email();
  institution.website = faker.internet.url();
  institution.regulatingBody = "Regulating Body";
  institution.establishedDate = faker.date.past(20);
  institution.institutionPrimaryContact = {
    primaryContactFirstName: faker.name.firstName(),
    primaryContactLastName: faker.name.lastName(),
    primaryContactEmail: faker.internet.email(),
    primaryContactPhone: faker.phone.phoneNumber(),
  };
  institution.legalAuthorityContact = {
    legalAuthorityFirstName: faker.name.firstName(),
    legalAuthorityLastName: faker.name.lastName(),
    legalAuthorityEmail: faker.internet.email(),
    legalAuthorityPhone: faker.phone.phoneNumber(),
  };
  institution.institutionAddress = {
    phone: faker.phone.phoneNumber(),
    addressLine1: faker.address.streetAddress(),
    addressLine2: faker.address.secondaryAddress(),
    provinceState: "BC",
    country: "CAN",
    city: "Victoria",
    postalCode: faker.address.zipCode("A9A9A9"),
  };
  return institution;
}