import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DatabaseModule } from "./database/database.module";
import { RouterModule } from "@nestjs/core";
import {
  StudentService,
  UserService,
  ConfigService,
  InstitutionService,
  ApplicationService,
  BCeIDServiceProvider,
  InstitutionUserAuthService,
  EducationProgramService,
  EducationProgramOfferingService,
  WorkflowActionsService,
  WorkflowService,
  FormService,
  InstitutionLocationService,
  FormsFlowService,
  ATBCService,
  StudentFileService,
  ProgramYearService,
  SequenceControlService,
  InstitutionTypeService,
  PIRDeniedReasonService,
  MSFAANumberService,
  COEDeniedReasonService,
  CRAIncomeVerificationService,
  SupportingUserService,
  StudentRestrictionService,
  DisbursementScheduleService,
  DisbursementScheduleErrorsService,
  RestrictionService,
  InstitutionRestrictionService,
  SINValidationService,
  DesignationAgreementLocationService,
  StudentAssessmentService,
  SFASApplicationService,
  SFASPartTimeApplicationsService,
  GCNotifyService,
  GCNotifyActionsService,
} from "./services";
import {
  UserController,
  ProgramYearController,
  ConfigController,
  DynamicFormController,
  CRAIntegrationController,
  EducationProgramController,
  EducationProgramOfferingController,
  ApplicationSystemController,
  ATBCController,
  ProgramInfoRequestController,
  ConfirmationOfEnrollmentController,
  InstitutionTypeController,
  MSFAAIntegrationController,
  SFASIntegrationController,
  ECertIntegrationController,
  FedRestrictionsIntegrationController,
  NotesController,
  RestrictionController,
  InstitutionLocationControllerService,
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { LoggerModule } from "./logger/logger.module";
import { CraIntegrationModule } from "./cra-integration/cra-integration.module";
import { MSFAAIntegrationModule } from "./esdc-integration/msfaa-integration/msfaa-integration.module";
import { SFASIntegrationModule } from "./sfas-integration/sfas-integration.module";
import { ECertIntegrationModule } from "./esdc-integration/e-cert-integration/e-cert-integration.module";
import { FedRestrictionIntegrationModule } from "./esdc-integration/fed-restriction-integration/fed-restriction-integration.module";
import { AppAESTModule } from "./app.aest.module";
import { AppInstitutionsModule } from "./app.institutions.module";
import { ClientTypeBaseRoute } from "./types";
import { AppStudentsModule } from "./app.students.module";
import { AppSystemAccessModule } from "./app.system-access.module";
import { AppSupportingUsersModule } from "./app.supporting-users.module";

@Module({
  imports: [
    LoggerModule,
    DatabaseModule,
    AuthModule,
    CraIntegrationModule,
    MSFAAIntegrationModule,
    SFASIntegrationModule,
    ECertIntegrationModule,
    FedRestrictionIntegrationModule,
    AppAESTModule,
    AppInstitutionsModule,
    AppStudentsModule,
    AppSystemAccessModule,
    AppSupportingUsersModule,
    RouterModule.register([
      {
        path: ClientTypeBaseRoute.Institution,
        module: AppInstitutionsModule,
      },
      {
        path: ClientTypeBaseRoute.AEST,
        module: AppAESTModule,
      },
      {
        path: ClientTypeBaseRoute.Student,
        module: AppStudentsModule,
      },
      {
        path: ClientTypeBaseRoute.SupportingUser,
        module: AppSupportingUsersModule,
      },
      {
        path: ClientTypeBaseRoute.SystemAccess,
        module: AppSystemAccessModule,
      },
    ]),
  ],
  controllers: [
    AppController,
    UserController,
    ProgramYearController,
    ConfigController,
    DynamicFormController,
    CRAIntegrationController,
    EducationProgramController,
    EducationProgramOfferingController,
    ApplicationSystemController,
    ATBCController,
    ProgramInfoRequestController,
    ConfirmationOfEnrollmentController,
    InstitutionTypeController,
    MSFAAIntegrationController,
    SFASIntegrationController,
    ECertIntegrationController,
    FedRestrictionsIntegrationController,
    NotesController,
    RestrictionController,
  ],
  providers: [
    AppService,
    UserService,
    StudentService,
    InstitutionService,
    ConfigService,
    BCeIDServiceProvider,
    WorkflowService,
    WorkflowActionsService,
    FormService,
    ApplicationService,
    InstitutionLocationService,
    FormsFlowService,
    InstitutionUserAuthService,
    EducationProgramService,
    EducationProgramOfferingService,
    ATBCService,
    StudentFileService,
    ProgramYearService,
    SequenceControlService,
    InstitutionTypeService,
    PIRDeniedReasonService,
    MSFAANumberService,
    COEDeniedReasonService,
    CRAIncomeVerificationService,
    SupportingUserService,
    StudentRestrictionService,
    DisbursementScheduleService,
    DisbursementScheduleErrorsService,
    RestrictionService,
    InstitutionRestrictionService,
    SINValidationService,
    DesignationAgreementLocationService,
    StudentAssessmentService,
    InstitutionLocationControllerService,
    SFASApplicationService,
    SFASPartTimeApplicationsService,
    GCNotifyService,
    GCNotifyActionsService,
  ],
})
export class AppModule {}
