/*Gamer参赛选手（继承抽象类）
独有属性：擅长游戏、所属战队 ID（-1代表无战队）；
仅拥有个人相关操作：查看个人信息、加入战队、退出战队、查看本人参赛对局。 */

/*定义公共类Gamer，继承AbstractPlayer抽象类  */
public class Gamer extends AbstractPlayer {

    /*独有属性：擅长游戏、所属战队 ID */
    private String skillGame;
    private int teamId;

    public Gamer(int id, String name, int age, String skillGame) {
        /*调用父类的构造方法，传递id、name、age*/
        /*super 是面向对象编程中的关键字，用于在子类中显式访问父类（超类）的成员。
        它解决的核心问题是：当子类与父类存在命名冲突，或需要调用父类特定实现时，如何明确指代"上一层"。*/
        super(id, name, age);
        this.skillGame = skillGame;
        this.teamId = -1;
    }

    @Override /*注解：表示这是重写父类的方法 */
    public void showInfo() {
        System.out.println("参赛选手信息:");
        printBasicInfo(); /*调用父类的方法打印基础信息（代码复用) */
        System.out.println("擅长游戏: " + skillGame);
        System.out.println("所属战队ID: " + (teamId == -1 ? "无战队" : teamId));
    }

    public void joinTeam(int teamId) {
        /*检查是否被拉黑  */
        if (banned) {
            System.out.println("错误: 您已被拉黑，无法加入战队！");
            return;
        }

        /*检查是否已有战队 */
        if (this.teamId != -1) {
            System.out.println("错误: 您已有战队，无法重复加入！");
            return;
        }

        /*声明目标战队变量，初始为null */
        Team targetTeam = null;

        /*遍历全局战队集合 */
        for (Team team : Main.teams) {
            if (team.getId() == teamId) {
                targetTeam = team;
                break;
            }
        }
        if (targetTeam == null) {
            System.out.println("错误: 目标战队不存在！");
            return;
        }
        if (targetTeam.getPlayerCount() >= 5) {
            System.out.println("错误: 目标战队已满员（最多5人）！");
            return;
        }
        this.teamId = teamId;
        targetTeam.addPlayer(this);
        System.out.println("成功加入战队 " + targetTeam.getName() + "！");
    }

    public void quitTeam() {
        if (teamId == -1) {
            System.out.println("错误: 您当前没有加入任何战队！");
            return;
        }
        teamId = -1;
        System.out.println("成功退出战队！");
    }

    public void queryPersonalMatches() {
        if (teamId == -1) {
            System.out.println("您当前没有加入任何战队，暂无参赛记录！");
            return;
        }
        System.out.println("我的参赛记录:");
        boolean found = false;
        for (MatchRecord record : Main.matchRecords.values()) {
            if (
                record.getTeamAId() == teamId || record.getTeamBId() == teamId
            ) {
                record.showRecord();
                found = true;
            }
        }
        if (!found) {
            System.out.println("暂无参赛记录！");
        }
    }

    public int getTeamId() {
        return teamId;
    }

    public String getSkillGame() {
        return skillGame;
    }
}
