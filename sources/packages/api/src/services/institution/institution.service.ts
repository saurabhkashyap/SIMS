import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import {
  Institution,
  InstitutionUser,
  InstitutionUserAuth,
  InstitutionUserTypeAndRole,
  User,
  InstitutionLocation,
  InstitutionType,
  Note,
  NoteType,
} from "../../database/entities";
import { Connection, Repository, getConnection } from "typeorm";
import {
  InstitutionUserRole,
  InstitutionUserType,
  UserInfo,
} from "../../types";
import { LoggerService } from "../../logger/logger.service";
import { BCeIDService } from "../bceid/bceid.service";
import { InjectLogger } from "../../common";
import { UserService } from "../user/user.service";
import { AccountDetails } from "../bceid/account-details.model";
import {
  sortUsersColumnMap,
  PaginationOptions,
  transformAddressDetails,
} from "../../utilities";
import { InstitutionUserRoles } from "../../auth/user-types.enum";
import {
  UpdateInstitution,
  InstitutionFormModel,
  InstitutionUserModel,
  InstitutionUserTypeAndRoleModel,
  InstitutionUserPermissionModel,
} from "./institution.service.model";
export const LEGAL_SIGNING_AUTHORITY_EXIST = "LEGAL_SIGNING_AUTHORITY_EXIST";
export const LEGAL_SIGNING_AUTHORITY_MSG =
  "Legal signing authority already exist for this Institution.";

@Injectable()
export class InstitutionService extends RecordDataModelService<Institution> {
  @InjectLogger()
  logger: LoggerService;

  institutionUserRepo: Repository<InstitutionUser>;
  institutionUserTypeAndRoleRepo: Repository<InstitutionUserTypeAndRole>;
  institutionUserAuthRepo: Repository<InstitutionUserAuth>;
  constructor(
    connection: Connection,
    private readonly bceidService: BCeIDService,
    private readonly userService: UserService,
  ) {
    super(connection.getRepository(Institution));
    this.institutionUserRepo = connection.getRepository(InstitutionUser);
    this.institutionUserTypeAndRoleRepo = connection.getRepository(
      InstitutionUserTypeAndRole,
    );
    this.institutionUserAuthRepo =
      connection.getRepository(InstitutionUserAuth);
    this.logger.log("[Created]");
  }

  async createAssociation({
    institution,
    type = InstitutionUserType.user,
    user,
    location,
    role,
    institutionUser,
  }: {
    institution: Institution;
    type: InstitutionUserType;
    user?: User;
    location?: InstitutionLocation;
    role?: InstitutionUserRole;
    institutionUser?: InstitutionUser;
  }): Promise<InstitutionUser> {
    const finalInstitutionUser =
      institutionUser || this.institutionUserRepo.create();
    finalInstitutionUser.user = user;
    finalInstitutionUser.institution = institution;
    const auth = this.institutionUserAuthRepo.create();
    const authType = await this.institutionUserTypeAndRoleRepo.findOneOrFail({
      type,
      role: role || null,
    });
    auth.authType = authType;
    auth.institutionUser = institutionUser;
    auth.location = location;
    finalInstitutionUser.authorizations = [auth];
    return await this.institutionUserRepo.save(finalInstitutionUser);
  }

  /**
   * Creates all necessary records to have a new user added to the
   * institution, with the right permissions and ready to login.
   * Records will be creates on sims.users, sims.institution_users
   * and sims.institution_user_auth.
   * @param institutionId Institution to add the user.
   * @param bceidUserAccount BCeID account to be used to create the user.
   * @param permissionInfo Permissions informations to be added to the user.
   * @returns institution user
   */
  async createInstitutionUser(
    institutionId: number,
    bceidUserAccount: AccountDetails,
    permissionInfo: InstitutionUserModel,
  ): Promise<InstitutionUser> {
    // Used to create the relationships with institution.
    const institution = { id: institutionId } as Institution;
    // Create the new user to be added to sims.users table.
    // The user should not be present at the table at this moment.
    const userEntity = new User();
    userEntity.email = bceidUserAccount.user.email;
    userEntity.firstName = bceidUserAccount.user.firstname;
    userEntity.lastName = bceidUserAccount.user.surname;
    userEntity.userName = `${bceidUserAccount.user.guid}@bceid`.toLowerCase();
    // Create new relationship between institution and the new user.
    const newInstitutionUser = new InstitutionUser();
    newInstitutionUser.user = userEntity;
    newInstitutionUser.institution = institution;
    newInstitutionUser.authorizations = [];
    // Create the permissions for the user under the institution.
    for (const permission of permissionInfo.permissions) {
      const newAuthorization = new InstitutionUserAuth();
      if (permission.locationId) {
        // Add a location specific permission.
        newAuthorization.location = {
          id: permission.locationId,
        } as InstitutionLocation;
      }
      // Find the correct user type and role.
      const authType = await this.institutionUserTypeAndRoleRepo.findOne({
        type: permission.userType,
        role: permission.userRole ?? null,
      });
      if (!authType) {
        throw new Error(
          "The combination of user type and user role is not valid.",
        );
      }
      newAuthorization.authType = authType;
      newInstitutionUser.authorizations.push(newAuthorization);
    }

    return this.institutionUserRepo.save(newInstitutionUser);
  }

  async createInstitution(
    userInfo: UserInfo,
    institutionModel: InstitutionFormModel,
  ): Promise<Institution> {
    const institution = this.create();
    const user = new User();
    const account = await this.bceidService.getAccountDetails(
      userInfo.idp_user_name,
    );

    if (account == null) {
      //This scenario occurs if basic BCeID users try to push the bceid account into our application.
      this.logger.error(
        "Account information could not be retrieved from BCeID",
      );
      return;
    }

    //Username retrieved from the token
    user.userName = userInfo.userName;
    user.firstName = account.user.firstname;
    user.lastName = account.user.surname;
    user.email = institutionModel.userEmail;

    institution.guid = account.institution.guid;
    institution.legalOperatingName = account.institution.legalName;
    institution.operatingName = institutionModel.operatingName;
    institution.primaryPhone = institutionModel.primaryPhone;
    institution.primaryEmail = institutionModel.primaryEmail;
    institution.website = institutionModel.website;
    institution.regulatingBody = institutionModel.regulatingBody;
    institution.establishedDate = institutionModel.establishedDate;
    institution.institutionType = {
      id: institutionModel.institutionType,
    } as InstitutionType;

    //Institution Primary Contact Information
    institution.institutionPrimaryContact = {
      firstName: institutionModel.primaryContactFirstName,
      lastName: institutionModel.primaryContactLastName,
      email: institutionModel.primaryContactEmail,
      phone: institutionModel.primaryContactPhone,
    };

    //Institution Address
    institution.institutionAddress = {
      mailingAddress: transformAddressDetails(institutionModel),
    };

    await this.createAssociation({
      institution,
      user,
      type: InstitutionUserType.admin,
    });

    return institution;
  }

  async getInstituteByUserName(userName: string): Promise<Institution> {
    return this.repo
      .createQueryBuilder("institution")
      .leftJoin("institution.users", "institutionUsers")
      .leftJoinAndSelect("institution.institutionType", "institutionType")
      .leftJoin("institutionUsers.user", "user")
      .where("user.userName = :userName", { userName })
      .andWhere("user.isActive = :isActive", { isActive: true })
      .getOneOrFail();
  }

  async syncInstitution(userInfo: UserInfo): Promise<void> {
    const account = await this.bceidService.getAccountDetails(
      userInfo.idp_user_name,
    );
    const user = await this.userService.getActiveUser(userInfo.userName);
    if (!user) {
      throw new UnprocessableEntityException("No user record found for user");
    }
    let institutionEntity: Institution;
    try {
      institutionEntity = await this.getInstituteByUserName(userInfo.userName);
    } catch (excp) {
      this.logger.error(
        `Unable to load institution for user: ${user.userName} error: ${excp}`,
      );
      this.logger.log(
        "Try to load institution from bceid account info and create association",
      );

      institutionEntity = await this.repo.findOne({
        guid: account.institution.guid,
      });
      if (institutionEntity) {
        // Create association with user
        await this.createAssociation({
          institution: institutionEntity,
          user,
          type: InstitutionUserType.admin,
        });
      } else {
        throw new UnprocessableEntityException(
          "Unable to find institution for user",
        );
      }
    }
    if (institutionEntity.guid !== account.institution.guid) {
      throw new UnprocessableEntityException(
        "Unable to process BCeID account of current user because account institution guid mismatch",
      );
    }
    institutionEntity.legalOperatingName = account.institution.legalName;
    await this.save(institutionEntity);

    if (user) {
      user.firstName = account.user.firstname;
      user.lastName = account.user.surname;
      await this.userService.save(user);
    }
  }

  /**
   * service method to get all institution users with the
   * given institutionId.
   * @param institutionId institution id
   * @param paginationOptions
   * @returns All the institution users for the given institution
   * with total count.
   */
  async getInstitutionUsers(
    institutionId: number,
    paginationOptions: PaginationOptions,
  ): Promise<[InstitutionUser[], number]> {
    // Default sort oder for user summary DataTable
    const DEFAULT_SORT_FIELD_FOR_USER_DATA_TABLE = "displayName";

    const institutionUsers = this.institutionUserRepo
      .createQueryBuilder("institutionUser")
      .select([
        "institutionUser.id",
        "user.id",
        "user.email",
        "user.firstName",
        "user.lastName",
        "user.userName",
        "user.isActive",
        "authorizations",
        "authorizations.authType",
        "authorizations.id",
        "authType.role",
        "authType.type",
        "authorizations.location",
        "location.name",
      ])
      .innerJoin("institutionUser.user", "user")
      .innerJoin("institutionUser.institution", "institution")
      .leftJoin("institutionUser.authorizations", "authorizations")
      .leftJoin("authorizations.location", "location")
      .leftJoin("authorizations.authType", "authType")
      .where("institution.id = :institutionId", { institutionId });

    // search by user's name
    if (paginationOptions.searchCriteria) {
      institutionUsers.andWhere(
        "CONCAT(user.firstName,  ' ', user.lastName ) ILIKE :searchUser",
        {
          searchUser: `%${paginationOptions.searchCriteria.trim()}%`,
        },
      );
    }
    // sorting
    sortUsersColumnMap(
      paginationOptions.sortField ?? DEFAULT_SORT_FIELD_FOR_USER_DATA_TABLE,
    ).forEach((sortElement, index) => {
      if (index === 0) {
        institutionUsers.orderBy(sortElement, paginationOptions.sortOrder);
      } else {
        institutionUsers.addOrderBy(sortElement, paginationOptions.sortOrder);
      }
    });

    // pagination
    institutionUsers
      .take(paginationOptions.pageLimit)
      .skip(paginationOptions.page * paginationOptions.pageLimit);
    // result
    return institutionUsers.getManyAndCount();
  }

  async getUserTypesAndRoles(): Promise<InstitutionUserTypeAndRoleModel> {
    const types: {
      type: string;
    }[] = await this.institutionUserTypeAndRoleRepo.query(
      "SELECT DISTINCT user_type as type FROM sims.institution_user_type_roles;",
    );
    const roles: {
      role: string;
    }[] = await this.institutionUserTypeAndRoleRepo.query(
      "SELECT DISTINCT user_role as role FROM sims.institution_user_type_roles;",
    );
    return {
      userTypes: types.map((typeObject) => typeObject.type),
      userRoles: roles
        .filter((roleObject) => roleObject.role !== null)
        .map((roleObject) => roleObject.role),
    };
  }

  async getUser(id: number): Promise<InstitutionUser> {
    return this.institutionUserRepo
      .createQueryBuilder("institutionUser")
      .leftJoinAndSelect("institutionUser.user", "user")
      .leftJoinAndSelect("institutionUser.institution", "institution")
      .leftJoinAndSelect("institutionUser.authorizations", "authorizations")
      .leftJoinAndSelect("authorizations.location", "location")
      .leftJoinAndSelect("authorizations.authType", "authType")
      .where("institutionUser.id = :id", { id })
      .getOne();
  }

  async getInstitutionUserByUserName(
    userName: string,
  ): Promise<InstitutionUser> {
    return this.institutionUserRepo
      .createQueryBuilder("institutionUser")
      .leftJoinAndSelect("institutionUser.user", "user")
      .leftJoinAndSelect("institutionUser.institution", "institution")
      .leftJoinAndSelect("institutionUser.authorizations", "authorizations")
      .leftJoinAndSelect("authorizations.location", "location")
      .leftJoinAndSelect("authorizations.authType", "authType")
      .where("user.userName = :userName", { userName })
      .getOne();
  }

  async getAssociationByUserID(
    institutionUser: InstitutionUser,
  ): Promise<InstitutionUserAuth[]> {
    return this.institutionUserAuthRepo.find({
      institutionUser: institutionUser,
    });
  }

  async doesExist(guid: string): Promise<boolean> {
    const count = await this.repo.count({ guid: guid });
    if (1 === count) {
      return true;
    }
    return false;
  }

  async updateInstitutionUser(
    permissionInfo: InstitutionUserPermissionModel,
    institutionUser: InstitutionUser,
  ): Promise<void> {
    const newAuthorizationEntries = [] as InstitutionUserAuth[];
    // Create the permissions for the user under the institution.
    for (const permission of permissionInfo.permissions) {
      const newAuthorization = new InstitutionUserAuth();
      newAuthorization.institutionUser = institutionUser;
      if (permission.locationId) {
        // Add a location specific permission.
        newAuthorization.location = {
          id: permission.locationId,
        } as InstitutionLocation;
      }
      // Find the correct user type and role.
      const authType = await this.institutionUserTypeAndRoleRepo.findOne({
        type: permission.userType,
        role: permission.userRole ?? null,
      });
      if (!authType) {
        throw new Error(
          "The combination of user type and user role is not valid.",
        );
      }
      newAuthorization.authType = authType;
      newAuthorizationEntries.push(newAuthorization);
    }

    // establish  database connection
    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    // get previous associations
    const previousAssociations = await this.getAssociationByUserID(
      institutionUser,
    );
    // open new transaction:
    await queryRunner.startTransaction();
    try {
      // delete existing associations
      await queryRunner.manager.remove(previousAssociations);
      // add new associations
      await queryRunner.manager.save(newAuthorizationEntries);
      // commit transaction :
      await queryRunner.commitTransaction();
    } catch (err) {
      // rollback on exceptions
      await queryRunner.rollbackTransaction();
      throw new Error(`Expection -${err}.`);
    } finally {
      // release query runner
      await queryRunner.release();
    }
  }

  /**
   * Search the institution based on the search criteria.
   * @param legalName legalName of the institution.
   * @param operatingName operatingName of the institution.
   * @returns Searched institution details.
   */
  async searchInstitution(
    legalName: string,
    operatingName: string,
  ): Promise<Institution[]> {
    const searchQuery = this.repo
      .createQueryBuilder("institution")
      .select([
        "institution.legalOperatingName",
        "institution.operatingName",
        "institution.institutionAddress",
        "institution.id",
      ])
      .where("1 = 1");
    if (legalName) {
      searchQuery.andWhere("institution.legalOperatingName Ilike :legalName", {
        legalName: `%${legalName}%`,
      });
    }
    if (operatingName) {
      searchQuery.andWhere("institution.operatingName Ilike :operatingName", {
        operatingName: `%${operatingName}%`,
      });
    }
    return searchQuery.getMany();
  }

  /**
   * Get the institution by ID.
   * @param institutionId Institution id.
   * @returns Location retrieved, if found, otherwise returns null.
   */
  async getInstitutionDetailById(institutionId: number): Promise<Institution> {
    return this.repo
      .createQueryBuilder("institution")
      .select(["institution", "institutionType.id", "institutionType.name"])
      .innerJoin("institution.institutionType", "institutionType")
      .where("institution.id = :institutionId", { institutionId })
      .getOne();
  }

  /**
   * Get the basic info of the institution by ID.
   * @param institutionId Institution id.
   * @returns Institution retrieved, if found, otherwise returns null.
   */
  async getBasicInstitutionDetailById(
    institutionId: number,
  ): Promise<Institution> {
    return this.repo
      .createQueryBuilder("institution")
      .select(["institution.id", "institution.operatingName"])
      .where("institution.id = :institutionId", { institutionId })
      .getOne();
  }

  /**
   * Service to get notes for a student.
   * @param institutionId
   * @param noteType
   * @returns Notes
   */
  async getInstitutionNotes(
    institutionId: number,
    noteType?: NoteType,
  ): Promise<Note[]> {
    const institutionNoteQuery = this.repo
      .createQueryBuilder("institution")
      .select([
        "institution.id",
        "note.noteType",
        "note.description",
        "note.createdAt",
        "user.firstName",
        "user.lastName",
      ])
      .innerJoin("institution.notes", "note")
      .innerJoin("note.creator", "user")
      .where("institution.id = :institutionId", { institutionId });
    if (noteType) {
      institutionNoteQuery.andWhere("note.noteType = :noteType", { noteType });
    }

    const institution = await institutionNoteQuery
      .orderBy("note.id", "DESC")
      .getOne();
    return institution?.notes;
  }

  /**
   * Service to add note for an Institution.
   * @param institutionId
   * @param note
   */
  async saveInstitutionNote(institutionId: number, note: Note): Promise<void> {
    const institution = await this.repo.findOne(institutionId, {
      relations: ["notes"],
    });
    institution.notes.push(note);
    await this.repo.save(institution);
  }

  /**
   * Service to get the admin roles .
   * @returns Admin roles.
   */
  async getAdminRoles(): Promise<InstitutionUserTypeAndRole[]> {
    return this.institutionUserTypeAndRoleRepo
      .createQueryBuilder("userRole")
      .select(["userRole.type", "userRole.role"])
      .where("userRole.type = 'admin'")
      .getMany();
  }

  /**
   * Checks if a legal signing authority is assigned to an Institution.
   * @param institutionId
   * @returns Legal signing authority object.
   */
  async checkLegalSigningAuthority(
    institutionId: number,
  ): Promise<InstitutionUserAuth> {
    const query = this.institutionUserAuthRepo
      .createQueryBuilder("userAuth")
      .select("userAuth.id")
      .innerJoin("userAuth.institutionUser", "institutionUser")
      .innerJoin("userAuth.authType", "role")
      .innerJoin("institutionUser.institution", "institution")
      .where("institution.id = :institutionId", { institutionId })
      .andWhere("role.role = :legalSigningAuthority", {
        legalSigningAuthority: InstitutionUserRoles.legalSigningAuthority,
      });
    return query.getOne();
  }

  /**
   * Update institution.
   * @param institutionId
   * @param updateInstitution
   * @returns updated Institution
   */
  async updateInstitution(
    institutionId: number,
    updateInstitution: Partial<UpdateInstitution>,
  ): Promise<Institution> {
    const institution = new Institution();
    institution.id = institutionId;

    institution.operatingName = updateInstitution.operatingName;
    institution.primaryPhone = updateInstitution.primaryPhone;
    institution.primaryEmail = updateInstitution.primaryEmail;
    institution.website = updateInstitution.website;
    institution.regulatingBody = updateInstitution.regulatingBody;
    institution.establishedDate = updateInstitution.establishedDate;
    institution.institutionType = {
      id: updateInstitution.institutionType,
    } as InstitutionType;

    institution.institutionPrimaryContact = {
      firstName: updateInstitution.primaryContactFirstName,
      lastName: updateInstitution.primaryContactLastName,
      email: updateInstitution.primaryContactEmail,
      phone: updateInstitution.primaryContactPhone,
    };

    institution.institutionAddress = {
      mailingAddress: transformAddressDetails(updateInstitution.mailingAddress),
    };
    return this.repo.save(institution);
  }
}
