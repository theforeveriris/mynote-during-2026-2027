import java.util.ArrayList;

/*存储队员列表 */

/*战队Team
属性：战队编号、战队名称、游戏分类、战队总积分、队内选手集合；
规则：单支战队最多容纳5名选手，满员后无法新增选手。 */
public class Team {

    private int id;
    private String name;
    private String game;
    private int score;
    private ArrayList<Gamer> players;

    public Team(int id, String name, String game) {
        this.id = id;
        this.name = name;
        this.game = game;
        this.score = 0;
        this.players = new ArrayList<>();
    }

    /*获取战队编号、战队名称、游戏分类、战队总积分、队内选手集合的 getter方法 */

    public int getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getGame() {
        return game;
    }

    public int getScore() {
        return score;
    }

    public int getPlayerCount() {
        return players.size();
    }

    public void addScore(int points) {
        score += points;
    }

    /* 添加队员的方法*/
    public boolean addPlayer(Gamer gamer) {
        if (players.size() >= 5) {
            return false;
        }
        players.add(gamer);
        return true;
    }

    public void showTeamInfo() {
        System.out.println("战队ID: " + id);
        System.out.println("战队名称: " + name);
        System.out.println("游戏分类: " + game);
        System.out.println("战队积分: " + score);
        System.out.println("队员人数: " + players.size() + "/5");
        System.out.println("队员列表:");
        /*遍历队员集合中的每个Gamer对象 */
        for (Gamer player : players) {
            System.out.println(
                "  - " + player.getName() + " (ID:" + player.getId() + ")"
            );
        }
    }
}
