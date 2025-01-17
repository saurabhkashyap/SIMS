<template>
  <header-navigator
    title="Report a change"
    :routeLocation="goBackRouteParams"
    subTitle="View Application"
  />
  <full-page-container class="p-m-4">
    <scholastic-standing-form
      :initialData="initialData"
      :readOnly="false"
      @submitted="submit"
      @customEvent="customEventCallback"
    />
  </full-page-container>
</template>
<script lang="ts">
import { RouteLocationRaw, useRouter } from "vue-router";
import { ref, onMounted, computed } from "vue";
import { InstitutionService } from "@/services/InstitutionService";
import {
  ApiProcessError,
  FormIOCustomEvent,
  FormIOCustomEventTypes,
} from "@/types";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import {
  APPLICATION_NOT_FOUND,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
  ScholasticStandingDataAPIInDTO,
} from "@/services/http/dto/ScholasticStanding.dto";
import { useFormatters, useToastMessage } from "@/composables";
import { ASSESSMENT_ALREADY_IN_PROGRESS } from "@/services/http/dto/Assessment.dto";
import { APPLICATION_CHANGE_NOT_ELIGIBLE } from "@/constants";
import { ScholasticStandingService } from "@/services/ScholasticStandingService";
import { ActiveApplicationDataAPIOutDTO } from "@/services/http/dto";
import ScholasticStandingForm from "@/components/common/ScholasticStandingForm.vue";

export default {
  components: {
    ScholasticStandingForm,
  },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
    locationId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const { dateOnlyLongString } = useFormatters();
    const initialData = ref({} as ActiveApplicationDataAPIOutDTO);
    const toast = useToastMessage();

    const loadInitialData = async () => {
      const applicationDetails =
        await InstitutionService.shared.getActiveApplication(
          props.applicationId,
          props.locationId,
        );
      initialData.value = {
        ...applicationDetails,
        applicationOfferingStartDate: dateOnlyLongString(
          applicationDetails.applicationOfferingStartDate,
        ),
        applicationOfferingEndDate: dateOnlyLongString(
          applicationDetails.applicationOfferingEndDate,
        ),
        applicationOfferingStudyBreak:
          applicationDetails.applicationOfferingStudyBreak?.map(
            (studyBreak) => ({
              breakStartDate: dateOnlyLongString(studyBreak.breakStartDate),
              breakEndDate: dateOnlyLongString(studyBreak.breakEndDate),
            }),
          ),
      };
    };

    const customEventCallback = async (form: any, event: FormIOCustomEvent) => {
      if (
        FormIOCustomEventTypes.RouteToInstitutionActiveSummaryPage ===
        event.type
      ) {
        router.push({
          name: InstitutionRoutesConst.ACTIVE_APPLICATIONS_SUMMARY,
          params: {
            locationId: props.locationId,
          },
        });
      }
    };

    onMounted(async () => {
      await loadInitialData();
    });

    const goBackRouteParams = computed(
      () =>
        ({
          name: InstitutionRoutesConst.ACTIVE_APPLICATIONS_SUMMARY,
          params: {
            locationId: props.locationId,
          },
        } as RouteLocationRaw),
    );

    const submit = async (data: ScholasticStandingDataAPIInDTO) => {
      try {
        await ScholasticStandingService.shared.saveScholasticStanding(
          props.applicationId,
          props.locationId,
          data,
        );
        toast.success("Change Reported", "Report a change submitted");
        router.push(goBackRouteParams.value);
      } catch (error: unknown) {
        if (error instanceof ApiProcessError) {
          if (
            [
              APPLICATION_NOT_FOUND,
              INVALID_OPERATION_IN_THE_CURRENT_STATUS,
              ASSESSMENT_ALREADY_IN_PROGRESS,
              APPLICATION_CHANGE_NOT_ELIGIBLE,
            ].includes(error.errorType)
          ) {
            toast.warn("Not able to submit", error.message);
            return;
          }
        }
        toast.error(
          "Unexpected error",
          "An unexpected error happened during the submission.",
        );
      }
    };

    return {
      initialData,
      customEventCallback,
      submit,
      goBackRouteParams,
    };
  },
};
</script>
