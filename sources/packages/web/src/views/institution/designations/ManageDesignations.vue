<template>
  <div class="p-m-4">
    <header-navigator
      title="Manage institutions"
      subTitle="Manage designations"
    />
    <full-page-container class="mt-4">
      <body-header
        title="Designation agreements"
        subTitle="Ensure you have an active designation to administer student financial
        assistance."
        :recordsCount="designations.length"
      >
        <template #actions>
          <v-btn
            v-if="isLegalSigningAuthority"
            class="ml-2 primary-btn-background"
            data-cy="requestDesignation"
            @click="goToRequestDesignation()"
            ><font-awesome-icon
              :icon="['fas', 'concierge-bell']"
              class="mr-2"
            />Request designation</v-btn
          >
        </template>
      </body-header>
      <designation-agreement-summary
        :designations="designations"
        toggleMessage="You don't have any agreements yet"
        @viewDesignation="goToViewDesignation"
      />
    </full-page-container>
  </div>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { onMounted, ref } from "vue";
import { DesignationAgreementService } from "@/services/DesignationAgreementService";
import {
  GetDesignationAgreementsDto,
  DesignationAgreementStatus,
} from "@/types/contracts/DesignationAgreementContract";
import { useInstitutionAuth, useToastMessage } from "@/composables";
import DesignationAgreementSummary from "@/components/partial-view/DesignationAgreement/DesignationAgreementSummary.vue";

export default {
  components: {
    DesignationAgreementSummary,
  },
  setup() {
    const router = useRouter();
    const toast = useToastMessage();
    const { isLegalSigningAuthority } = useInstitutionAuth();
    const designations = ref([] as GetDesignationAgreementsDto[]);

    const goToRequestDesignation = () => {
      const hasPendingDesignation = designations.value.some(
        (designation) =>
          designation.designationStatus === DesignationAgreementStatus.Pending,
      );
      if (!hasPendingDesignation) {
        router.push({
          name: InstitutionRoutesConst.DESIGNATION_REQUEST,
        });
      } else {
        toast.warn(
          "Pending Designation",
          "There is already a pending designation agreement.",
        );
      }
    };

    const goToViewDesignation = (id: number) => {
      return router.push({
        name: InstitutionRoutesConst.DESIGNATION_VIEW,
        params: { designationAgreementId: id },
      });
    };

    onMounted(async () => {
      designations.value =
        await DesignationAgreementService.shared.getDesignationsAgreements();
    });

    return {
      designations,
      goToRequestDesignation,
      goToViewDesignation,
      isLegalSigningAuthority,
    };
  },
};
</script>
