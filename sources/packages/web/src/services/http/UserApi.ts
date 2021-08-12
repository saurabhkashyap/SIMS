import {
  BCeIDDetailsDto,
  BCeIDAccountsDto,
  InstitutionUserDetailsDto,
} from "../../types/contracts/UserContract";
import HttpBaseClient from "./common/HttpBaseClient";

export class UserApi extends HttpBaseClient {
  public async checkUser(headers?: any): Promise<boolean> {
    try {
      const response = await this.apiClient.get(
        "users/check-user",
        headers || this.addAuthHeader(),
      );
      return response.data as boolean;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async bceidAccount(headers?: any): Promise<BCeIDDetailsDto | null> {
    try {
      const response = await this.apiClient.get(
        "users/bceid-account",
        headers || this.addAuthHeader(),
      );
      return response.data as BCeIDDetailsDto;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async bceidAccounts(headers?: any): Promise<BCeIDAccountsDto | null> {
    try {
      const response = await this.apiClient.get(
        "users/bceid-accounts",
        headers || this.addAuthHeader(),
      );
      return response.data as BCeIDAccountsDto;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async checkActiveUser(headers?: any): Promise<boolean> {
    try {
      const response = await this.apiClient.get(
        "users/check-active-user",
        headers || this.addAuthHeader(),
      );
      return response.data as boolean;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getinstitutionUser(
    headers?: any,
  ): Promise<InstitutionUserDetailsDto> {
    try {
      const response = await this.apiClient.get(
        "users/institutionUser",
        headers || this.addAuthHeader(),
      );
      return response.data as InstitutionUserDetailsDto;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async updateInstitutionUser(
    data: InstitutionUserDetailsDto,
    headers?: any,
  ): Promise<void> {
    try {
      const response = await this.apiClient.patch(
        "users/institutionUser",
        data,
        headers || this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
