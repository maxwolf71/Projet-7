<template>
  <div>
    <Nav />
    <div class="userCard">
      <h1 class="userCard__name">{{ user.firstName }} {{ user.lastName }}</h1> 
      <h3 class="userCard__bio">Bio :</h3>
      <router-link :to="{ name: 'Bio', params: { id: this.$store.state.user.userId } }">
        <p class="bio">{{ user.bio }}</p>
      </router-link>
      <button @click="logout" class="button">Sign out</button>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex"
import Nav from "@/components/Nav"

export default {
  name: "Profile",
  components: { Nav },
  mounted() {
    if (this.$store.state.user.userId == -1) {
      //if user doesn't exist
      this.$router.push("/") //go back to login
      return
    }
    this.$store.dispatch("getUserInfos") // retrieve user infos
  },
  computed: {
    ...mapState({
      user: "userInfos",
    }),
  },
  methods: {
    logout() {
      this.$store.commit("logout")
      this.$router.push("/")
    },
  },
}
</script>

<style lang="scss" scoped>
@import "src/assets/styles/_variables.scss";

.userCard {
  text-align: center;
  width: 540px;
  background: $blue;
  border-radius: 16px;
  padding: 10px;
  border: 4px solid #fff;
  margin: 150px auto;

  &__name {
    color: $white;
    font-size: 2rem;
    text-decoration: 6px underline $mainRed;
  }
  &__bio {
    color: $white;
    font-size: 1.2rem;
  }
  .bio {
  font-weight: bold;
  padding: 20px 0;
  border: 4px solid $white;
  margin: 20px;
  color: $white;
  border-radius: 16px;
  }
}
</style>
      