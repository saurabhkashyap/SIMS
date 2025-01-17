<template>
  <IdleTimeChecker :clientIdType="ClientIdType.Institution">
    <v-app-bar dense flat app style="overflow: visible">
      <BCLogo subtitle="Institution Application"></BCLogo>
      <v-spacer></v-spacer>
      <v-btn
        v-if="isAuthenticated"
        text
        @click="
          $router.push({
            name: InstitutionRoutesConst.INSTITUTION_DASHBOARD,
          })
        "
        >Home</v-btn
      >
      <v-btn
        v-if="isAuthenticated && isAdmin"
        text
        @click="
          $router.push({
            name: InstitutionRoutesConst.MANAGE_LOCATIONS,
          })
        "
        >Manage Institution</v-btn
      >

      <v-btn
        v-if="isAuthenticated"
        text
        @click="
          $router.push({
            name: InstitutionRoutesConst.INSTITUTION_USER_PROFILE,
          })
        "
        >PROFILE</v-btn
      >
      <v-btn
        v-if="isAuthenticated"
        class="mr-5"
        icon="mdi-account"
        variant="outlined"
        elevation="1"
        color="grey"
        @click="togleUserMenu"
      ></v-btn>
      <Menu
        v-if="isAuthenticated"
        ref="userOptionsMenuRef"
        :model="userMenuItems"
        :popup="true"
      />
    </v-app-bar>
    <router-view name="sidebar"></router-view>
    <v-main class="body-background">
      <v-container fluid>
        <router-view></router-view>
      </v-container>
    </v-main>
  </IdleTimeChecker>
</template>

<script lang="ts">
import { ref } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { ClientIdType } from "@/types";
import { useInstitutionAuth } from "@/composables/institution/useInstitutionAuth";
import { useAuth } from "@/composables";
import BCLogo from "@/components/generic/BCLogo.vue";
import "@/assets/css/institution.scss";
import IdleTimeChecker from "@/components/common/IdleTimeChecker.vue";

export default {
  components: { BCLogo, IdleTimeChecker },
  setup() {
    const { executeLogout } = useAuth();
    const userOptionsMenuRef = ref();
    const userMenuItems = ref({});
    const { isAdmin, isAuthenticated } = useInstitutionAuth();

    const logoff = async () => {
      await executeLogout(ClientIdType.Institution);
    };

    const togleUserMenu = (event: any) => {
      userOptionsMenuRef.value.toggle(event);
    };

    userMenuItems.value = [
      {
        label: "Notifications Settings",
        icon: "pi pi-bell",
      },
      {
        label: "Log off",
        icon: "pi pi-power-off",
        command: logoff,
      },
    ];

    return {
      userMenuItems,
      isAdmin,
      isAuthenticated,
      logoff,
      userOptionsMenuRef,
      togleUserMenu,
      InstitutionRoutesConst,
      ClientIdType,
    };
  },
};
</script>
