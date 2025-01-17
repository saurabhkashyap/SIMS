import {
  SummaryEducationProgramDto,
  OptionItemDto,
  EducationProgramData,
  DataTableSortOrder,
  ProgramSummaryFields,
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE_NUMBER,
  PaginatedResults,
  ApproveProgram,
  DeclineProgram,
  StudentEducationProgramAPIOutDTO,
} from "@/types";
import HttpBaseClient from "./common/HttpBaseClient";
import { addSortOptions } from "@/helpers";

export class EducationProgramApi extends HttpBaseClient {
  public async getProgram(programId: number): Promise<any> {
    try {
      const response = await this.apiClient.get(
        `institution/education-program/${programId}`,
        this.addAuthHeader(),
      );
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async createProgram(createProgramDto: any): Promise<void> {
    try {
      await this.apiClient.post(
        "institution/education-program",
        createProgramDto,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async updateProgram(
    programId: number,
    updateProgramDto: any,
  ): Promise<void> {
    try {
      await this.apiClient.put(
        `institution/education-program/${programId}`,
        updateProgramDto,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  /**
   * Prepare the API to fetch all institution
   * location program.
   * @param locationId location id
   * @param page, page number if nothing is passed then
   * DEFAULT_PAGE_NUMBER is taken
   * @param pageLimit, limit of the page if nothing is
   * passed then DEFAULT_PAGE_LIMIT is taken
   * @param searchCriteria, program name keyword to be searched
   * @param sortField, field to be sorted
   * @param sortOrder, order to be sorted
   * @returns program summary for an institution location.
   */
  public async getLocationProgramsSummary(
    locationId: number,
    page = DEFAULT_PAGE_NUMBER,
    pageCount = DEFAULT_PAGE_LIMIT,
    searchCriteria?: string,
    sortField?: ProgramSummaryFields,
    sortOrder?: DataTableSortOrder,
  ): Promise<PaginatedResults<SummaryEducationProgramDto>> {
    try {
      let url = `institution/education-program/location/${locationId}/summary?page=${page}&pageLimit=${pageCount}`;
      if (searchCriteria) {
        url = `${url}&searchCriteria=${searchCriteria}`;
      }
      url = addSortOptions(url, sortField, sortOrder);
      const response = await this.getCall(url);
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getEducationProgram(
    programId: number,
  ): Promise<EducationProgramData> {
    try {
      const response = await this.apiClient.get(
        `institution/education-program/${programId}/details`,
        this.addAuthHeader(),
      );
      return response.data as EducationProgramData;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  /**
   * Returns the education program for a student.
   * @param programId program id to be returned.
   * @returns education program for a student.
   */
  public async getStudentEducationProgram(
    programId: number,
  ): Promise<StudentEducationProgramAPIOutDTO> {
    return this.getCallTyped(
      this.addClientRoot(`education-program/${programId}`),
    );
  }

  /**
   * Gets location programs option list authorized for students.
   * @param locationId location id.
   * @returns location programs option list.
   */
  public async getLocationProgramsOptionList(
    locationId: number,
    programYearId: number,
    includeInActivePY?: boolean,
  ): Promise<OptionItemDto[]> {
    try {
      let url = `institution/education-program/location/${locationId}/program-year/${programYearId}/options-list`;
      if (includeInActivePY) {
        url = `${url}?includeInActivePY=${includeInActivePY}`;
      }
      const response = await this.getCall(url);
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  /**
   * Gets location programs list authorized for institutions.
   * @returns location programs list for institutions.
   */
  public async getProgramsListForInstitutions(): Promise<OptionItemDto[]> {
    try {
      const response = await this.apiClient.get(
        "institution/education-program/programs-list",
        this.addAuthHeader(),
      );
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  /**
   * Education Program Details for ministry users
   * @param programId program id
   * @returns Education Program Details
   */
  public async getEducationProgramForAEST(
    programId: number,
  ): Promise<EducationProgramData> {
    try {
      const response = await this.apiClient.get(
        `institution/education-program/${programId}/aest`,
        this.addAuthHeader(),
      );
      return response.data as EducationProgramData;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  /**
   * Ministry user approve's a pending program.
   * @param programId program id.
   * @param institutionId institution id.
   * @param payload ApproveProgram.
   */
  public async approveProgram(
    programId: number,
    institutionId: number,
    payload: ApproveProgram,
  ): Promise<void> {
    await this.patchCall(
      `institution/education-program/${programId}/institution/${institutionId}/approve/aest`,
      payload,
    );
  }

  /**
   * Ministry user decline's a pending program.
   * @param programId program id.
   * @param institutionId institution id.
   * @param payload DeclineProgram.
   */
  public async declineProgram(
    programId: number,
    institutionId: number,
    payload: DeclineProgram,
  ): Promise<void> {
    await this.patchCall(
      `institution/education-program/${programId}/institution/${institutionId}/decline/aest`,
      payload,
    );
  }
}
