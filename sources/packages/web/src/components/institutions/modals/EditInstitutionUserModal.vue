<template>
  <!-- Edit user -->
  <Dialog
    v-if="showEditUser"
    header="Edit User Permissions"
    v-model:visible="display"
    :modal="true"
    :style="{ width: '50vw' }"
    :closable="false"
  >
    <v-divider></v-divider>
    <v-sheet color="white" elevation="1">
      <v-container>
        <form>
          <v-row cols="12">
            <v-col>
              <span class="form-text text-muted mb-2"
                ><strong>User Name</strong></span
              >
              <span class="form-text text-muted mb-2">
                {{ userData?.user?.firstName }} {{ userData?.user?.lastName }}
              </span>
            </v-col>
            <v-col>
              <span class="form-text text-muted mb-2">
                <strong>Is this User an Admin?</strong><br />
                <strong>
                  Selected:<span v-if="isAdmin"> Yes </span
                  ><span v-else> No </span>
                </strong>
              </span>
              <InputSwitch v-model="isAdmin" />
            </v-col>
            <v-col v-if="isAdmin">
              <span class="form-text text-muted mb-2"
                ><strong>Select Admin Role</strong></span
              >
              <!-- TODO: remove inline styles when moving to Vuetify component. -->
              <Dropdown
                v-model="selectedAdminRole"
                :options="adminRoles"
                :style="{ width: '20vw' }"
                optionLabel="name"
              />
            </v-col>
          </v-row>
          <span v-if="!isAdmin">
            <v-divider></v-divider>
            <h4 class="color-blue">Location Based Access</h4>
            <v-row
              v-if="institutionLocationList && !institutionLocationList.length"
              ><Message :closable="false"
                >Institution locations need to be added first inorder to add a
                non-admin users to institution</Message
              >
            </v-row>
            <span v-else>
              <v-row
                ><v-col>
                  <span class="form-text text-muted mb-2">
                    <strong>Locations</strong>
                  </span> </v-col
                ><v-col>
                  <span class="form-text text-muted mb-2">
                    <strong>User Type</strong>
                  </span>
                </v-col>
              </v-row>
              <v-row v-for="location in institutionLocationList" :key="location"
                ><v-col>
                  <span>{{ location?.name }} </span><br />
                  <span>
                    <span>{{ location?.data?.address?.addressLine1 }}, </span>
                    <span>{{ location?.data?.address?.city }}, </span>
                    <span>{{ location?.data?.address?.provinceState }}</span>
                    <br />
                  </span>
                </v-col>
                <v-col>
                  <Dropdown
                    v-model="location.userType"
                    :options="userType"
                    optionLabel="name"
                    placeholder="Select a User Role"
                    :style="{ width: '25vw' }"
                    :class="invalidUserType ? 'p-invalid' : ''"
                  />
                </v-col>
              </v-row>
            </span>
          </span>
        </form>
      </v-container>
    </v-sheet>
    <template #footer>
      <v-btn color="primary" variant="outlined" @click="closeEditUser()">
        Cancel
      </v-btn>
      <v-btn color="primary" @click="submitEditUser()">
        Save Changes
        <v-icon size="25" right>mdi-account </v-icon>
      </v-btn>
    </template>
  </Dialog>
</template>

<script lang="ts">
/* eslint-disable */
import { ref, watch } from "vue";
import { InstitutionService } from "@/services/InstitutionService";
import Dialog from "primevue/dialog";
import Dropdown from "primevue/dropdown";
import InputSwitch from "primevue/inputswitch";
import { useToastMessage } from "@/composables";
import {
  InstitutionUserAuthDetails,
  LEGAL_SIGNING_AUTHORITY_EXIST,
  LEGAL_SIGNING_AUTHORITY_MSG,
} from "@/types";

import {
  InstitutionUserAPIOutDTO,
  UserRoleOptionAPIOutDTO,
} from "@/services/http/dto";

export default {
  components: { Dialog, Dropdown, InputSwitch },
  props: {
    showEditUser: {
      type: Boolean,
      default: false,
    },
    userType: {
      type: Array,
      default: [],
    },
    institutionUserName: {
      type: String,
      default: "",
    },
    adminRoles: {
      type: Array,
      required: true,
    },
  },
  emits: ["updateShowEditInstitutionModal", "getAllInstitutionUsers"],
  setup(props: any, context: any) {
    const userData = ref({} as InstitutionUserAPIOutDTO);
    const isAdmin = ref(false);
    const toast = useToastMessage();
    const invalidUserType = ref(false);
    const display = ref(true);
    const institutionLocationList = ref();
    const payLoad = ref({} as InstitutionUserAuthDetails);
    /**Initialized with default value */
    const selectedAdminRole = ref({
      name: "admin",
      code: "admin",
    } as UserRoleOptionAPIOutDTO);

    const closeEditUser = async () => {
      context.emit("updateShowEditInstitutionModal");
      invalidUserType.value = false;
      await getInstitutionUserDetails();
      checkIsAdmin();
      await getAndSetAllLocations();
    };
    const checkIsAdmin = () => {
      isAdmin.value = userData.value?.authorizations?.some(
        (el: any) => el?.authType?.type == "admin",
      );
    };
    const getAndSetAllLocations = async () => {
      institutionLocationList.value = [];
      const allLocations =
        await InstitutionService.shared.getAllInstitutionLocations();
      for (const eachLocation of allLocations) {
        let selectedLocation = false;
        let proceesedLocation = {};
        for (const assignedLocation of userData.value?.authorizations) {
          if (eachLocation.id === assignedLocation.location?.id) {
            selectedLocation = true;
            proceesedLocation = {
              ...assignedLocation.location,
              userType: {
                name: assignedLocation?.authType?.type,
                code: assignedLocation?.authType?.type,
              },
            };
          }
        }
        if (!selectedLocation) {
          proceesedLocation = {
            ...eachLocation,
            userType: {
              name: null,
              code: null,
            },
          };
        }
        if (proceesedLocation) {
          institutionLocationList.value.push(proceesedLocation);
        }
      }
    };
    const getInstitutionUserDetails = async () => {
      try {
        userData.value =
          await InstitutionService.shared.getInstitutionLocationUserDetails(
            props.institutionUserName,
          );

        const adminAuth = userData.value.authorizations?.find(
          (role) => role.authType?.type === "admin",
        );

        if (adminAuth) {
          selectedAdminRole.value = {
            name: adminAuth.authType.role
              ? adminAuth.authType.role
              : adminAuth.authType.type,
            code: adminAuth.authType.role
              ? adminAuth.authType.role
              : adminAuth.authType.type,
          };
        }
      } catch (error) {
        toast.error(
          "Unexpected error",
          "An error happened during the fetch process.",
        );
      }
    };

    const submitEditUser = async () => {
      invalidUserType.value = false;
      payLoad.value = await InstitutionService.shared.prepareEditUserPayload(
        props.institutionUserName,
        isAdmin.value,
        selectedAdminRole.value?.code,
        institutionLocationList.value,
      );
      if (
        (payLoad.value &&
          payLoad.value?.location &&
          payLoad.value?.location?.length) ||
        isAdmin.value
      ) {
        try {
          await InstitutionService.shared.updateUser(
            props.institutionUserName as string,
            payLoad.value,
          );
          toast.success(
            "User Updated",
            `${userData.value?.user?.firstName} Updated Successfully!`,
          );
        } catch (excp) {
          const errorMessage =
            excp === LEGAL_SIGNING_AUTHORITY_EXIST
              ? LEGAL_SIGNING_AUTHORITY_MSG
              : "An error happened during the update process.";
          toast.error("Unexpected error", errorMessage);
        }
        closeEditUser();
        context.emit("getAllInstitutionUsers");
      } else {
        if (payLoad.value?.location?.length === 0) {
          invalidUserType.value = true;
        }
      }
    };
    watch(
      () => props.institutionUserName,
      async (currValue, preValue) => {
        // get user details
        await getInstitutionUserDetails();
        await getAndSetAllLocations();
        checkIsAdmin();
      },
    );
    return {
      institutionLocationList,
      invalidUserType,
      display,
      closeEditUser,
      isAdmin,
      submitEditUser,
      userData,
      selectedAdminRole,
    };
  },
};
</script>
