require("../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { KeycloakConfig } from "../../auth/keycloakConfig";
import { ApplicationSystemController } from "..";
import { DatabaseModule } from "../../database/database.module";
import { AuthModule } from "../../auth/auth.module";
import {
  ApplicationService,
  KeycloakService,
  SequenceControlService,
} from "../../services";
import { createFakeApplication } from "../../testHelpers/fake-entities/application-fake";
import { setGlobalPipes } from "../../utilities/auth-utils";
import { Connection, Repository } from "typeorm";
import {
  Application,
  EducationProgram,
  EducationProgramOffering,
  Institution,
  InstitutionLocation,
} from "../../database/entities";
import {
  createFakeLocation,
  createFakeInstitution,
  createFakeEducationProgram,
  createFakeEducationProgramOffering,
} from "../../testHelpers/fake-entities";

describe("Test system-access/application Controller", () => {
  let accesstoken: string;
  let app: INestApplication;
  let applicationRepository: Repository<Application>;
  let institutionRepository: Repository<Institution>;
  let locationRepository: Repository<InstitutionLocation>;
  let programRepository: Repository<EducationProgram>;
  let offeringRepository: Repository<EducationProgramOffering>;

  beforeAll(async () => {
    await KeycloakConfig.load();
    const token = await KeycloakService.shared.getTokenFromClientSecret(
      "forms-flow-bpm",
      process.env.FORMS_FLOW_BPM_CLIENT_SECRET,
    );
    accesstoken = token.access_token;

    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, AuthModule],
      controllers: [ApplicationSystemController],
      providers: [ApplicationService, SequenceControlService],
    }).compile();

    const connection = module.get(Connection);
    applicationRepository = connection.getRepository(Application);
    locationRepository = connection.getRepository(InstitutionLocation);
    institutionRepository = connection.getRepository(Institution);
    programRepository = connection.getRepository(EducationProgram);
    offeringRepository = connection.getRepository(EducationProgramOffering);

    app = module.createNestApplication();
    setGlobalPipes(app);
    await app.init();
  });

  describe("Test route PATCH :id/program-info", () => {
    it("should return bad request for an invalid Program Request Info (PIR) status", async () => {
      await request(app.getHttpServer())
        .patch("/system-access/application/1/program-info")
        .auth(accesstoken, { type: "bearer" })
        .send({
          offeringId: 1, // Valid
          locationId: 1, // Valid
          status: "some invalid status", // Invalid
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("should return bad request for an invalid locationId", async () => {
      await request(app.getHttpServer())
        .patch("/system-access/application/1/program-info")
        .auth(accesstoken, { type: "bearer" })
        .send({
          offeringId: 1, // Valid
          locationId: -1, // Invalid
          status: "required", // Valid
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("should return bad request for an invalid offeringId", async () => {
      await request(app.getHttpServer())
        .patch("/system-access/application/1/program-info")
        .auth(accesstoken, { type: "bearer" })
        .send({
          offeringId: -1, // Invalid
          locationId: 1, // Valid
          status: "required", // Valid
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("should return bad request when locationId is not present", async () => {
      await request(app.getHttpServer())
        .patch("/system-access/application/1/program-info")
        .auth(accesstoken, { type: "bearer" })
        .send({
          offeringId: 1, // Valid
          // locationId not present
          status: "required", // Valid
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("should return bad request when status is not present", async () => {
      await request(app.getHttpServer())
        .patch("/system-access/application/1/program-info")
        .auth(accesstoken, { type: "bearer" })
        .send({
          offeringId: 1, // Valid
          locationId: 1, // Valid
          // status not present.
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("should be able to change the Program Info Status (location, offering, status) when payload is valid", async () => {
      // Create fake application.
      const testApplication = await applicationRepository.save(
        createFakeApplication(),
      );
      // Create fake institution.
      const testInstitution = await institutionRepository.save(
        createFakeInstitution(),
      );
      // Create fake location.
      const testLocation = await locationRepository.save(
        createFakeLocation(testInstitution),
      );
      // Create fake program.
      const testProgram = await programRepository.save(
        createFakeEducationProgram(testInstitution),
      );
      // Create fake offering.
      const testOffering = await offeringRepository.save(
        createFakeEducationProgramOffering(testProgram, testLocation),
      );

      const routeUrl = `/system-access/application/${testApplication.id}/program-info`;
      try {
        await request(app.getHttpServer())
          .patch(routeUrl)
          .auth(accesstoken, { type: "bearer" })
          .send({
            offeringId: testOffering.id,
            locationId: testLocation.id,
            status: "completed", // Valid
          })
          .expect(HttpStatus.OK);
        // Check if the database was updated as expected.
        const updatedApplication = await applicationRepository.findOne(
          testApplication.id,
          { relations: ["offering", "location"] },
        );
        expect(updatedApplication.offering.id).toBe(testOffering.id);
        expect(updatedApplication.location.id).toBe(testLocation.id);
        expect(updatedApplication.pirStatus).toBe("completed");
      } finally {
        await offeringRepository.remove(testOffering);
        await programRepository.remove(testProgram);
        await locationRepository.remove(testLocation);
        await institutionRepository.remove(testInstitution);
        await applicationRepository.remove(testApplication);
      }
    });
  });

  describe("Test route PATCH :id/program-info/status", () => {
    it("should return bad request for an invalid Program Request Info (PIR) status", async () => {
      await request(app.getHttpServer())
        .patch("/system-access/application/1/program-info/status")
        .auth(accesstoken, { type: "bearer" })
        .send({ status: "some invalid status" })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("should be able to change the status to 'required'/'not required'/'completed'", async () => {
      const applicationToCreate = createFakeApplication();
      const testApplication = await applicationRepository.save(
        applicationToCreate,
      );
      const routeUrl = `/system-access/application/${testApplication.id}/program-info/status`;
      try {
        const statuses = ["required", "not required", "completed"];
        for (const status of statuses) {
          await request(app.getHttpServer())
            .patch(routeUrl)
            .auth(accesstoken, { type: "bearer" })
            .send({ status })
            .expect(HttpStatus.OK);
          // Check if the database was updated as expected.
          const updatedApplication = await applicationRepository.findOne(
            testApplication.id,
          );
          expect(updatedApplication.pirStatus).toBe(status);
        }
      } finally {
        await applicationRepository.remove(testApplication);
      }
    });
  });

  describe("Test route GET :id/offering", () => {
    it("should return a HTTP NOT_FOUND (404) when the offering does not exists", async () => {
      await request(app.getHttpServer())
        .get(`/system-access/application/${-1}/offering`)
        .auth(accesstoken, { type: "bearer" })
        .expect(HttpStatus.NOT_FOUND);
    });

    it("should be able to get an offering associated to an application when the application and offering exists", async () => {
      // Create fake institution.
      const testInstitution = await institutionRepository.save(
        createFakeInstitution(),
      );
      // Create fake location.
      const testLocation = await locationRepository.save(
        createFakeLocation(testInstitution),
      );
      // Create fake program.
      const testProgram = await programRepository.save(
        createFakeEducationProgram(testInstitution),
      );
      // Create fake offering.
      const testOffering = await offeringRepository.save(
        createFakeEducationProgramOffering(testProgram, testLocation),
      );
      // Create fake application using the previously saved offering.
      const testApplication = await applicationRepository.save(
        createFakeApplication(null, testOffering),
      );

      try {
        await request(app.getHttpServer())
          .get(`/system-access/application/${testApplication.id}/offering`)
          .auth(accesstoken, { type: "bearer" })
          .expect(HttpStatus.OK)
          .then((resp) => {
            expect(resp.body).toBeDefined();
            expect(resp.body.id).toBe(testOffering.id);
            expect(resp.body.studyStartDate).toBe(testOffering.studyStartDate);
            expect(resp.body.studyEndDate).toBe(testOffering.studyEndDate);
            expect(resp.body.breakStartDate).toBe(testOffering.breakStartDate);
            expect(resp.body.breakEndDate).toBe(testOffering.breakEndDate);
            expect(resp.body.actualTuitionCosts).toBe(
              testOffering.actualTuitionCosts,
            );
            expect(resp.body.programRelatedCosts).toBe(
              testOffering.programRelatedCosts,
            );
            expect(resp.body.mandatoryFees).toBe(testOffering.mandatoryFees);
            expect(resp.body.exceptionalExpenses).toBe(
              testOffering.exceptionalExpenses,
            );
            expect(resp.body.tuitionRemittanceRequestedAmount).toBe(
              testOffering.tuitionRemittanceRequestedAmount,
            );
            expect(resp.body.offeringDelivered).toBe(
              testOffering.offeringDelivered,
            );
          });
      } finally {
        await offeringRepository.remove(testOffering);
        await programRepository.remove(testProgram);
        await locationRepository.remove(testLocation);
        await institutionRepository.remove(testInstitution);
        await applicationRepository.remove(testApplication);
      }
    });
  });
});