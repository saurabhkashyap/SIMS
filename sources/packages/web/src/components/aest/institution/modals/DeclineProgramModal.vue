<template>
  <ModalDialogBase
    title="Decline program"
    :showDialog="showDialog"
    @dialogClosed="dialogClosed"
  >
    <template v-slot:content>
      <formio
        formName="declineEducationProgram"
        @submitted="submitForm"
        @loaded="formLoaded"
      ></formio>
    </template>
    <template v-slot:footer>
      <v-btn variant="outlined" :color="COLOR_BLUE" @click="dialogClosed">
        Cancel
      </v-btn>
      <v-btn class="primary-btn-background" @click="declineProgram">
        Decline now
      </v-btn>
    </template>
  </ModalDialogBase>
</template>

<script lang="ts">
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useModalDialog } from "@/composables";
import { COLOR_BLUE } from "@/constants";
import { DeclineProgram } from "@/types";

export default {
  components: {
    ModalDialogBase,
  },
  setup() {
    const { showDialog, resolvePromise, showModal } = useModalDialog<
      DeclineProgram | undefined
    >();
    let declineProgramForm: any = undefined;

    const declineProgram = () => {
      return declineProgramForm.submit();
    };
    const submitForm = (formData: DeclineProgram) => {
      resolvePromise(formData);
    };

    const formLoaded = (form: any) => {
      declineProgramForm = form;
    };

    const dialogClosed = () => {
      resolvePromise(undefined);
    };

    return {
      showDialog,
      declineProgram,
      showModal,
      dialogClosed,
      COLOR_BLUE,
      formLoaded,
      submitForm,
    };
  },
};
</script>
