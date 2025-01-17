import HttpBaseClient from "./common/HttpBaseClient";
import {
  InstitutionLocationFormAPIInDTO,
  InstitutionLocationFormAPIOutDTO,
  ActiveApplicationDataAPIOutDTO,
  OptionItemAPIOutDTO,
  InstitutionUserAPIOutDTO,
  InstitutionUserAPIInDTO,
  UserActiveStatusAPIInDTO,
  InstitutionUserLocationsAPIOutDTO,
  InstitutionLocationPrimaryContactAPIInDTO,
  InstitutionLocationAPIInDTO,
} from "@/services/http/dto";

export class InstitutionLocationApi extends HttpBaseClient {
  public async createInstitutionLocation(
    createInstitutionLocationDto: InstitutionLocationFormAPIInDTO,
  ): Promise<void> {
    return this.postCall<InstitutionLocationFormAPIInDTO>(
      this.addClientRoot("location"),
      createInstitutionLocationDto,
    );
  }

  public async updateInstitutionLocation(
    locationId: number,
    updateInstitutionLocationDto:
      | InstitutionLocationPrimaryContactAPIInDTO
      | InstitutionLocationAPIInDTO,
  ): Promise<void> {
    return this.patchCall<
      InstitutionLocationPrimaryContactAPIInDTO | InstitutionLocationAPIInDTO
    >(
      this.addClientRoot(`location/${locationId}`),
      updateInstitutionLocationDto,
    );
  }

  public async getInstitutionLocation(
    locationId: number,
  ): Promise<InstitutionLocationFormAPIOutDTO> {
    return this.getCallTyped<InstitutionLocationFormAPIOutDTO>(
      this.addClientRoot(`location/${locationId}`),
    );
  }

  /**
   * This client expects custom error message in one or more
   * scenarios and hence trying to parse and throw the message
   * if available.
   * @param createInstitutionUserDto
   */
  public async createUser(
    createInstitutionUserDto: InstitutionUserAPIInDTO,
  ): Promise<void> {
    return this.postCall<InstitutionUserAPIInDTO>(
      this.addClientRoot("institution/user"),
      createInstitutionUserDto,
    );
  }

  public async getInstitutionLocationUserDetails(
    userName: string,
  ): Promise<InstitutionUserAPIOutDTO> {
    return this.getCallTyped<InstitutionUserAPIOutDTO>(
      this.addClientRoot(`institution/user/${userName}`),
    );
  }

  /**
   * This client expects custom error message in one or more
   * scenarios and hence trying to parse and throw the message
   * if available.
   * @param updateInstitutionUserDto
   */
  public async updateUser(
    userName: string,
    updateInstitutionUserDto: InstitutionUserAPIInDTO,
  ): Promise<void> {
    return this.patchCall<InstitutionUserAPIInDTO>(
      this.addClientRoot(`institution/user/${userName}`),
      updateInstitutionUserDto,
    );
  }

  public async updateUserStatus(
    userName: string,
    userStatus: boolean,
  ): Promise<void> {
    return this.patchCall<UserActiveStatusAPIInDTO>(
      this.addClientRoot(`institution/user-status/${userName}`),
      {
        isActive: userStatus,
      },
    );
  }

  public async getMyInstitutionLocationsDetails(
    header?: any,
  ): Promise<InstitutionUserLocationsAPIOutDTO[]> {
    return this.getCallTyped<InstitutionUserLocationsAPIOutDTO[]>(
      this.addClientRoot("institution/my-locations"),
      header,
    );
  }

  public async getOptionsList(): Promise<OptionItemAPIOutDTO[]> {
    return this.getCallTyped<OptionItemAPIOutDTO[]>(
      this.addClientRoot("location/options-list"),
    );
  }

  public async getActiveApplication(
    applicationId: number,
    locationId: number,
  ): Promise<ActiveApplicationDataAPIOutDTO> {
    return this.getCallTyped<ActiveApplicationDataAPIOutDTO>(
      this.addClientRoot(
        `location/${locationId}/active-application/${applicationId}`,
      ),
    );
  }
}
