<template>
  <!-- This component is shared between ministry and student users -->
  <v-row>
    <v-col cols="8">
      <p class="category-header-large color-blue">
        All Locations({{ institutionLocationList.length ?? 0 }})
      </p>
    </v-col>
    <v-col cols="4" v-if="clientType === ClientIdType.Institution">
      <v-btn
        class="float-right primary-btn-background"
        @click="goToAddNewLocation()"
      >
        <font-awesome-icon
          :icon="['fas', 'external-link-square-alt']"
          class="mr-2"
        />Add New Location
      </v-btn>
    </v-col>
  </v-row>
  <ContentGroup
    v-for="item in institutionLocationList"
    :key="item"
    class="ma-2"
  >
    <v-row>
      <v-col cols="11">
        <span>
          <font-awesome-icon :icon="['fas', 'map-pin']" />
          <span class="category-header-medium mx-2">{{ item.name }}</span>
          <status-chip-designation-agreement :status="item.designationStatus" />
        </span>
      </v-col>
      <v-col cols="1">
        <v-btn
          color="primary"
          variant="text"
          @click="$emit('editLocation', item.id)"
        >
          <font-awesome-icon :icon="['fas', 'cog']" class="mr-2" />
          Edit
        </v-btn>
      </v-col>
    </v-row>
    <v-row>
      <!-- Address 1 -->
      <v-col>
        <TitleValue propertyTitle="Address 1" />
        <span
          class="text-muted clearfix"
          v-for="addressLine in addressList1(item)"
          :key="addressLine"
        >
          {{ addressLine }}
        </span>
      </v-col>

      <!-- Address 2 -->
      <v-col>
        <TitleValue propertyTitle="Address 2" />
        <span>---</span>
      </v-col>

      <!-- Primary contact -->
      <v-col>
        <TitleValue propertyTitle=" Primary Contact" />
        <span
          class="text-muted clearfix"
          v-for="contactLine in primaryContactList(item)"
          :key="contactLine"
        >
          {{ contactLine }}
        </span>
      </v-col>
      <!-- Institution code -->
      <v-col>
        <TitleValue
          propertyTitle="Institution code"
          :propertyValue="item.institutionCode"
        />
      </v-col>
    </v-row>
  </ContentGroup>
</template>
<script lang="ts">
import { useRouter } from "vue-router";
import { ref, onMounted, computed } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { InstitutionService } from "@/services/InstitutionService";
import { ClientIdType } from "@/types/contracts/ConfigContract";
import TitleValue from "@/components/generic/TitleValue.vue";
import { InstitutionLocationsDetails } from "@/types";
import { AuthService } from "@/services/AuthService";
import StatusChipDesignationAgreement from "@/components/generic/StatusChipDesignationAgreement.vue";
import { InstitutionLocationAPIOutDTO } from "@/services/http/dto";
import { useFormatters } from "@/composables";

export default {
  emits: ["editLocation"],
  components: {
    TitleValue,
    StatusChipDesignationAgreement,
  },
  props: {
    institutionId: {
      type: Number,
      required: false,
    },
  },
  setup(props: any) {
    const formatter = useFormatters();
    const router = useRouter();
    const clientType = computed(() => AuthService.shared.authClientType);
    const goToAddNewLocation = () => {
      router.push({ name: InstitutionRoutesConst.ADD_INSTITUTION_LOCATION });
    };
    const institutionLocationList = ref([] as InstitutionLocationAPIOutDTO[]);

    //The institutionId is passed for ministry API
    const getInstitutionLocationList = async () => {
      institutionLocationList.value =
        await InstitutionService.shared.getAllInstitutionLocations(
          props.institutionId,
        );
    };

    const addressList1 = (item: InstitutionLocationsDetails) => {
      return [
        item.data.address.addressLine1,
        item.data.address.addressLine2,
        formatter.getFormattedAddress(item.data.address),
        item.data.address.country,
      ].filter((address) => address);
    };

    const primaryContactList = (item: InstitutionLocationsDetails) => {
      return [
        `${item.primaryContact.primaryContactFirstName} ${item.primaryContact.primaryContactLastName}`,
        item.primaryContact.primaryContactPhone,
        item.primaryContact.primaryContactEmail,
      ].filter((contact) => contact);
    };

    onMounted(async () => {
      getInstitutionLocationList();
    });

    return {
      goToAddNewLocation,
      getInstitutionLocationList,
      institutionLocationList,
      ClientIdType,
      addressList1,
      primaryContactList,
      clientType,
    };
  },
};
</script>
